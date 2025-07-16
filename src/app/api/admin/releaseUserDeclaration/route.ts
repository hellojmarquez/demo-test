export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import nodeFetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { createLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT
		let verifiedPayload;
		try {
			const { payload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
			verifiedPayload = payload;
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		const formD = await req.formData();

		const { user_declaration, release } = JSON.parse(
			formD.get('data') as string
		);
		// Parsear campos individuales
		const fileName = formD.get('fileName') as string;
		const data = JSON.parse(formD.get('data') as string);
		const chunk = formD.get('chunk') as Blob;
		const chunkIndex = parseInt(formD.get('chunkIndex') as string);
		const totalChunks = parseInt(formD.get('totalChunks') as string);
		const fileType = formD.get('fileType') as string;
		let tempFilePath: string | null = null;
		let picture_path = '';
		let picture_url = '';
		let tempDir: string | null = null;
		let safeFileName: string | null = null;
		let file_path = '';
		let file_url = '';

		if (fileName && fileName.length > 0) {
			if (isNaN(chunkIndex) || isNaN(totalChunks)) {
				console.log('Datos de chunk inválidos');
				return NextResponse.json(
					{ success: false, error: 'Datos de chunk inválidos' },
					{ status: 400 }
				);
			}
			const tempDir = path.join(process.cwd(), 'temp_uploads');
			await fs.mkdir(tempDir, { recursive: true });

			// Define el nombre del archivo temporal. ESTO DEBE ESTAR FUERA DEL IF.
			const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
			const tempFileName = `upload_${safeFileName}.tmp`;
			tempFilePath = path.join(tempDir, tempFileName);
			const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
			await fs.appendFile(tempFilePath, chunkBuffer);

			if (chunkIndex < totalChunks - 1) {
				return NextResponse.json({
					success: true,
					message: `Chunk ${chunkIndex} recibido`,
				});
			}

			const extension = path.extname(fileName);

			if (extension.toLowerCase() !== '.pdf') {
				console.log('extension no soportado');
				await fs.unlink(tempFilePath);
				return NextResponse.json(
					{ success: false, error: 'Formato de archivo no soportado!' },
					{ status: 400 }
				);
			}
			const fixedname = fileName.replaceAll(' ', '_');

			const safeName = fixedname;
			const uploadMediaReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${safeName}&filetype=application/pdf&upload_type=release.license`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `JWT ${moveMusicAccessToken}`,
						'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
						Referer: process.env.MOVEMUSIC_REFERER || '',
					},
				}
			);
			if (!uploadMediaReq) {
				console.log('Error al obtener la url firmada');
				return NextResponse.json(
					{ error: 'Error al obtener la url firmada' },
					{ status: 400 }
				);
			}
			const uploadMediaRes = await uploadMediaReq.json();
			const { url: signedUrl, fields: mediaFields } = uploadMediaRes.signed_url;
			const mediaFormData = new FormData();
			Object.entries(mediaFields).forEach(([key, value]) => {
				if (typeof value === 'string' || value instanceof Blob) {
					mediaFormData.append(key, value);
				}
			});
			const { size: fileSize } = await fs.stat(tempFilePath);
			const fileStream = createReadStream(tempFilePath);
			mediaFormData.append('file', fileStream, {
				filename: safeName,
				contentType: 'application/pdf',
				knownLength: fileSize,
			});
			const uploadResponse = await nodeFetch(signedUrl, {
				method: 'POST',
				body: mediaFormData,
				headers: mediaFormData.getHeaders(),
			});

			await fs.unlink(tempFilePath);
			picture_url = uploadResponse?.headers?.get('location') || '';
			const picture_path_decoded = decodeURIComponent(
				new URL(picture_url).pathname.slice(1)
			);
			picture_path = picture_path_decoded.replace('media/', '');
		}
		let dataToApi = {
			release,
			user_declaration,
			release_license: picture_path.length > 0 ? picture_path : '',
		};

		const uploadDataReq = await fetch(
			`${process.env.MOVEMUSIC_API}/release-user-declaration/`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify(dataToApi),
			}
		);

		if (!uploadDataReq.ok) {
			const apiRes = await uploadDataReq.json();

			return NextResponse.json(
				{
					success: false,
					error: apiRes || 'Error al subir el archivo de archivo a S3',
				},
				{ status: uploadDataReq.status || 400 }
			);
		}
		const apiRes = await uploadDataReq.json();

		if (file_url.length > 0) {
			const updatedRelease = await Release.findOneAndUpdate(
				{ external_id: release },
				{ $set: { release_user_declaration: apiRes } },
				{ new: true }
			);
			try {
				const logData = {
					action: 'UPDATE' as const,
					entity: 'RELEASE' as const,
					entityId: updatedRelease._id?.toString(),
					userId: verifiedPayload.id as string,
					userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
					userRole: verifiedPayload.role as string,
					details: `Declaracion de usuario creado: ${updatedRelease?.name} `,
					ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
				};
				await createLog(logData);
			} catch (logError) {
				console.error('Error al crear el log:', logError);
				// No interrumpimos el flujo si falla el log
			}
		}

		return NextResponse.json({
			success: true,
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
