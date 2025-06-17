import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';

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
		const formData = await request.formData();
		let name = formData.get('name') as string;
		name = name.trim();
		let email = formData.get('email') as string;
		email = email.trim();
		const linkLogo = formData.get('logo') as string;
		let password = formData.get('password') as string;
		password = password.trim();
		const primary_genre = formData.get('primary_genre') as string;
		const year = formData.get('year') as string;
		const catalog_num = formData.get('catalog_num') as string;
		const picture = formData.get('picture') as File | null;
		const isSubaccount = formData.get('isSubaccount') === 'true';
		const parentUserId = formData.get('parentUserId') as string;
		const parentName = formData.get('parentName') as string;
		let logo = '';
		if (linkLogo) {
			logo = decodeURIComponent(new URL(linkLogo).pathname.slice(1));
		}
		let picture_url = '';
		let picture_path = '';
		// Validar campos requeridos
		// if (!name || !primary_genre || !year || !catalog_num) {
		// 	return NextResponse.json(
		// 		{ error: 'Todos los campos son requeridos' },
		// 		{ status: 400 }
		// 	);
		// }
		await dbConnect();

		// Validar que el email no exista
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			return NextResponse.json(
				{ error: 'El email ya está registrado' },
				{ status: 400 }
			);
		}

		if (picture && picture instanceof File) {
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
				const picture_path_decoded = decodeURIComponent(
					new URL(picture_url).pathname.slice(1)
				);
				picture_path = picture_path_decoded.replace('media/', '');

				if (!uploadResponse.ok) {
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

		// Crear sello en API externa solo si no es subcuenta
		let external_id = null;

		const labelToApi = {
			logo: picture_path.length > 0 ? picture_path : logo,
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

		if (!createLabelRes.id) {
			return NextResponse.json({ success: false, error: createLabelRes });
		}
		external_id = createLabelRes.id;

		// Encriptar contraseña solo si no es subcuenta
		const hashedPassword = !isSubaccount
			? await encryptPassword(password)
			: null;

		// Crear el nuevo usuario
		const newUser = new User({
			external_id,
			name,
			email: !isSubaccount ? email.toLowerCase() : '',
			password: hashedPassword,
			role: 'sello',
			status: 'activo',
			permissions: ['sello'],
			picture: picture_path.length > 0 ? picture_path : linkLogo,
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
