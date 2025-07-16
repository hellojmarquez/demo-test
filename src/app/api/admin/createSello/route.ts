import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';
import FormData from 'form-data';
import nodeFetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
	try {
		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;
		const token = request.cookies.get('loginToken')?.value;
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

		// Verificar si es FormData
		const contentType = request.headers.get('content-type');
		if (!contentType?.includes('multipart/form-data')) {
			return NextResponse.json(
				{ message: 'Se requiere enviar los datos como FormData' },
				{ status: 400 }
			);
		}

		// Obtener datos del formulario
		const formD = await request.formData();
		const data = JSON.parse(formD.get('data') as string);
		const {
			name,
			email,
			password,
			primary_genre,
			year,
			catalog_num,
			isSubaccount,
			parentUserId,
			parentName,
		} = data;
		if (!data) {
			return NextResponse.json(
				{ error: 'No se recibieron datos para actualizar' },
				{ status: 400 }
			);
		}

		const picture = formD.get('picture');
		const fileName = formD.get('fileName') as string;
		const chunk = formD.get('chunk') as Blob;
		const chunkIndex = parseInt(formD.get('chunkIndex') as string);
		const totalChunks = parseInt(formD.get('totalChunks') as string);
		const fileType = formD.get('fileType') as string;
		let tempFilePath: string | null = null;

		let tempDir: string | null = null;
		let safeFileName: string | null = null;
		let picture_url = '';
		let picture_path = '';
		// Validar campos requeridos
		if (!name || !primary_genre || !year || !catalog_num) {
			return NextResponse.json(
				{ success: false, error: 'Todos los campos son requeridos' },
				{ status: 400 }
			);
		}
		await dbConnect();

		// Validar que el email no exista
		const existingUser = await User.findOne({ email: email });
		if (email) {
			if (
				existingUser === email &&
				existingUser.role === verifiedPayload.role
			) {
				return NextResponse.json(
					{ error: 'El sello con este email ya está registrado' },
					{ status: 400 }
				);
			}
		}
		let updateData: any = {
			name: data.name,
			primary_genre: data.primary_genre,
			year: parseInt(data.year as string),
			catalog_num: parseInt(data.catalog_num as string),
			logo: '',
		};
		if (fileName && fileName.length > 0) {
			if (isNaN(chunkIndex) || isNaN(totalChunks)) {
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

			const { size: fileSize } = await fs.stat(tempFilePath);
			const fileBuffer = await fs.readFile(tempFilePath);
			const metadata = await sharp(fileBuffer).metadata();
			const sizeInMB = fileSize / 1024 / 1024;

			if (
				metadata.width !== 1000 ||
				metadata.height !== 1000 ||
				(metadata.format !== 'jpeg' && metadata.format !== 'jpg') ||
				(metadata.space !== 'srgb' && metadata.space !== 'rgb')
			) {
				await fs.unlink(tempFilePath);
				return NextResponse.json(
					{
						success: false,
						error: 'La imagen no tiene el formato o características soportadas',
					},
					{ status: 400 }
				);
			}
			if (sizeInMB > 4) {
				await fs.unlink(tempFilePath);
				return NextResponse.json(
					{
						success: false,
						error: 'La imagen es debe pesar máximo 4MB',
					},
					{ status: 400 }
				);
			}
			const fixedname = fileName.replaceAll(' ', '_');

			const safeName = fixedname;
			const uploadMediaReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${safeName}&filetype=image/jpeg&upload_type=label.logo`,
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

			mediaFormData.append('file', fileBuffer, {
				filename: safeName,
				contentType: 'image/jpeg',
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
			updateData.logo = picture_path;
		}

		if (picture_path && picture_path.length > 0) {
			updateData.logo = picture_path;
		}

		// Crear sello en API externa solo si no es subcuenta
		let external_id = null;

		const labelToApi = {
			logo: picture_path,
			name,
			year: parseInt(year),
			catalog_num: parseInt(catalog_num),
		};

		const createLabelReq = await fetch(`${process.env.MOVEMUSIC_API}/labels/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `JWT ${moveMusicAccessToken}`,
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
			},
			body: JSON.stringify(labelToApi),
		});

		const createLabelRes = await createLabelReq.json();
		if (!createLabelReq.ok) {
			return NextResponse.json(
				{
					success: false,
					error: createLabelRes || 'Error al crear el sello en la API externa',
				},
				{ status: 400 }
			);
		}

		if (!createLabelRes.id) {
			return NextResponse.json({ success: false, error: createLabelRes });
		}
		external_id = createLabelRes.id;

		// Encriptar contraseña solo si no es subcuenta
		const hashedPassword = !isSubaccount
			? await encryptPassword(password)
			: null;

		// Crear el nuevo usuario
		const newUser = await User.create({
			external_id,
			name,
			email: !isSubaccount ? email : '',
			password: hashedPassword,
			role: 'sello',
			status: 'activo',
			permissions: ['sello'],
			picture: picture_url,
			tipo: isSubaccount ? 'subcuenta' : 'principal',
			parentId: isSubaccount ? parentUserId : null,
			parentName: isSubaccount ? parentName : null,
			subaccounts: !isSubaccount ? [] : undefined,
			// Campos específicos de sello
			primary_genre,
			year: parseInt(year),
			catalog_num: parseInt(catalog_num),
		});

		await newUser.save();

		if (!newUser.external_id) {
			return NextResponse.json(
				{
					success: false,
					error: newUser || 'Error al crear el sello',
				},
				{ status: 400 }
			);
		}

		try {
			// Crear el log
			const logData = {
				action: 'CREATE' as const,
				entity: 'USER' as const,
				entityId: newUser._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Sello creado: ${name}`,
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json(
			{
				success: true,
				message: isSubaccount
					? 'Subcuenta creada exitosamente'
					: 'Sello creado exitosamente',
			},
			{ status: 201 }
		);
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
