import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
	console.log('create sello request received');
	console.log('Content-Type:', req.headers.get('content-type'));

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
		try {
			const { payload: verifiedPayload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}
		await dbConnect();

		// Verificar si es FormData
		const contentType = req.headers.get('content-type');
		if (!contentType?.includes('multipart/form-data')) {
			return NextResponse.json(
				{ message: 'Se requiere enviar los datos como FormData' },
				{ status: 400 }
			);
		}

		const formData = await req.formData();
		console.log('Received form data fields:', Array.from(formData.keys()));

		// Extraer los campos del FormData
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const primary_genre = formData.get('primary_genre') as string;
		const year = formData.get('year') as string;
		const catalog_num = formData.get('catalog_num') as string;
		const picture = formData.get('picture') as File | null;

		console.log('Extracted fields:', {
			name,
			email,
			hasPassword: !!password,
			hasPicture: !!picture,
			primary_genre,
			year,
			catalog_num,
		});

		// Validar campos requeridos
		if (!name) {
			return NextResponse.json(
				{ message: 'Nombre, email y contraseña son requeridos' },
				{ status: 400 }
			);
		}

		// Verificar si el email ya existe
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return NextResponse.json(
				{ message: 'El email ya está registrado' },
				{ status: 400 }
			);
		}

		// Procesar la imagen si existe
		let pictureBuffer = null;
		if (picture) {
			console.log(picture);
			try {
				// const arrayBuffer = await picture.arrayBuffer();
				// pictureBuffer = Buffer.from(arrayBuffer);
				// console.log('Image converted to buffer successfully');
				const uploadPictureReq = await fetch(
					`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${picture.name}&filetype=image/jpeg&upload_type=label.logo`,
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
				const uploadPictureRes = await uploadPictureReq.json();
				console.log('uploadPictureRes', uploadPictureRes);
				// Extraer la URL y los campos del objeto firmado
				const { url: signedUrl, fields: trackFields } =
					uploadPictureRes.signed_url;
				// Crear un objeto FormData y agregar los campos y el archivo
				const trackFormData = new FormData();
				Object.entries(trackFields).forEach(([key, value]) => {
					if (typeof value === 'string' || value instanceof Blob) {
						trackFormData.append(key, value);
					} else {
						console.warn(
							`El valor de '${key}' no es un tipo válido para FormData:`,
							value
						);
					}
				});

				trackFormData.append('file', picture);

				// Realizar la solicitud POST a la URL firmada
				const uploadResponse = await fetch(signedUrl, {
					method: 'POST',
					body: trackFormData,
				});
				const uploadRes = await uploadResponse.json();
				console.log('uploadRes', uploadRes);
			} catch (error) {
				console.error('Error converting image to buffer:', error);
				return NextResponse.json(
					{ message: 'Error al procesar la imagen' },
					{ status: 400 }
				);
			}
		}

		// Crear el nuevo sello
		// const newSello = await User.create({
		// 	name,
		// 	email,
		// 	password,
		// 	picture: pictureBuffer,
		// 	role: 'sello',
		// 	status: 'active',
		// 	permissions: ['sello'],
		// 	primary_genre,
		// 	year: parseInt(year),
		// 	catalog_num: parseInt(catalog_num),
		// });

		console.log('Sello created successfully:');

		return NextResponse.json(
			{
				message: 'Sello creado exitosamente',
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error creating sello:', error);
		return NextResponse.json(
			{
				error: error.message || 'Internal Server Error',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
