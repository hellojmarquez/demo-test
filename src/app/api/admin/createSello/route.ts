import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
	console.log('create sello request received');

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

		// Extraer los campos del FormData
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const primary_genre = formData.get('primary_genre') as string;
		const yearString = formData.get('year') as string;
		const catalog_numString = formData.get('catalog_num') as string;
		const picture = formData.get('picture') as File | null;
		const year = Number(yearString);
		const catalog_num = Number(catalog_numString);

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
		let picture_url = '';
		let picture_path = '';
		if (picture) {
			console.log(picture);
			try {
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

				// Extraer la URL y los campos del objeto firmado
				const { url: signedUrl, fields: dataFields } =
					uploadPictureRes.signed_url;
				// Crear un objeto FormData y agregar los campos y el archivo
				const labelFormData = new FormData();
				Object.entries(dataFields).forEach(([key, value]) => {
					if (typeof value === 'string' || value instanceof Blob) {
						labelFormData.append(key, value);
					} else {
						console.warn(
							`El valor de '${key}' no es un tipo válido para FormData:`,
							value
						);
					}
				});

				labelFormData.append('file', picture);

				// Realizar la solicitud POST a la URL firmada
				const uploadResponse = await fetch(signedUrl, {
					method: 'POST',
					body: labelFormData,
				});

				picture_url = uploadResponse?.headers?.get('location') || '';
				picture_path = decodeURIComponent(
					new URL(picture_url).pathname.slice(1)
				);
				console.log('picture_path: ', picture_path);

				if (!uploadResponse.ok) {
					console.error(
						'Error al subir la imagen a S3:',
						await uploadResponse.text()
					);
					return NextResponse.json(
						{ message: 'Error al subir la imagen a S3' },
						{ status: 500 }
					);
				}
			} catch (error) {
				console.error('Error al procesar la imagen:', error);
				return NextResponse.json(
					{ message: 'Error al procesar la imagen' },
					{ status: 400 }
				);
			}
		}

		//crear sello en api
		const labelToApi = {
			name,
			logo: picture_path,
			primary_genre,
			year,
			catalog_num,
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
		console.log('createLabelRes', createLabelRes);

		// Crear el nuevo sello
		const labelToBBDD = {
			external_id: createLabelRes.id,
			name,
			email,
			password,
			picture: picture_url,
			role: 'sello',
			status: 'active',
			permissions: ['sello'],
			primary_genre,
			year,
			catalog_num,
		};

		const newSello = await User.create(labelToBBDD);

		console.log('Sello created successfully: ', newSello);

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
