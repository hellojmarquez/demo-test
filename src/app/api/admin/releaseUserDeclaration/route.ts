export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

import { createLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
	console.log(' release USER DECLARATION received');

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

		const formData = await req.formData();

		// Parsear campos individuales
		const doc = formData.get('file') as File | null;
		const user_declaration = Number(formData.get('user_declaration')) || null;
		const release = Number(formData.get('release')) || null;
		let file_path = '';
		let file_url = '';
		let dataToApi = {
			release,
			user_declaration,
			release_license: '',
		};
		console.log('dataToApi: ', dataToApi);
		if (doc) {
			if (doc.type !== 'application/pdf') {
				return NextResponse.json(
					{ success: false, error: 'El archivo debe ser formato PDF' },
					{ status: 400 }
				);
			}
			const fileName = doc.name.replaceAll(' ', '');
			const uploadFileReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${fileName}&filetype=${doc.type}&upload_type=release.license`,
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
			const uploadFileRes = await uploadFileReq.json();

			// Extraer la URL y los campos del objeto firmado
			const { url: signedUrl, fields: resFields } = uploadFileRes.signed_url;
			// Crear un objeto FormData y agregar los campos y el archivo
			const fileFormData = new FormData();
			Object.entries(resFields).forEach(([key, value]) => {
				if (typeof value === 'string' || value instanceof Blob) {
					fileFormData.append(key, value);
				} else {
					console.warn(
						`El valor de '${key}' no es un tipo válido para FormData:`,
						value
					);
				}
			});

			fileFormData.append('file', doc);

			// Realizar la solicitud POST a la URL firmada
			const S3Response = await fetch(signedUrl, {
				method: 'POST',
				body: fileFormData,
			});

			if (!S3Response.ok) {
				return NextResponse.json(
					{
						success: false,
						error:
							S3Response.statusText ||
							'Error al subir el archivo de archivo a S3',
					},
					{ status: S3Response.status || 400 }
				);
			}

			file_url = S3Response?.headers?.get('location') || '';
			const picture_path_decoded = decodeURIComponent(
				new URL(file_url).pathname.slice(1)
			);
			file_path = picture_path_decoded.replace('media/', '');
		}
		if (file_path.length > 0) {
			dataToApi.release_license = file_path;
		}
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

		const apiRes = await uploadDataReq.json();
		if (!apiRes.release) {
			console.log('apiRes error: ', apiRes);
			return NextResponse.json(
				{
					success: false,
					error: apiRes || 'Error al subir el archivo de archivo a S3',
				},
				{ status: uploadDataReq.status || 400 }
			);
		}

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
	} catch (error) {
		console.error('Error creating release:', error);
		return NextResponse.json(
			{ success: false, error: 'Error al crear el release' },
			{ status: 500 }
		);
	}
}
