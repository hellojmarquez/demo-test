import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { verifyToken } from '@/utils/jwt';
import { getTokenBack } from '@/utils/tokenBack';
import { jwtVerify } from 'jose';

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;
		const token = request.cookies.get('loginToken')?.value;
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
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const primary_genre = formData.get('primary_genre') as string;
		const year = formData.get('year') as string;
		const catalog_num = formData.get('catalog_num') as string;
		const picture = formData.get('picture') as File | null;
		const isSubaccount = formData.get('isSubaccount') === 'true';
		const parentUserId = formData.get('parentUserId') as string;
		const parentName = formData.get('parentName') as string;

		// Validar campos requeridos
		// if (!name || !primary_genre || !year || !catalog_num) {
		// 	return NextResponse.json(
		// 		{ error: 'Todos los campos son requeridos' },
		// 		{ status: 400 }
		// 	);
		// }

		// Validar campos específicos para cuenta principal
		if (!isSubaccount) {
			// if (!email || !password) {
			// 	return NextResponse.json(
			// 		{
			// 			error: 'Email y contraseña son requeridos para cuentas principales',
			// 		},
			// 		{ status: 400 }
			// 	);
			// }

			// Validar que el email no exista
			const existingUser = await User.findOne({ email: email.toLowerCase() });
			if (existingUser) {
				return NextResponse.json(
					{ error: 'El email ya está registrado' },
					{ status: 400 }
				);
			}
		}

		// Si es subcuenta, validar el usuario padre
		let parentUser = null;
		if (isSubaccount) {
			if (!parentUserId) {
				return NextResponse.json(
					{ error: 'Usuario padre es requerido para subcuentas' },
					{ status: 400 }
				);
			}

			parentUser = await User.findById(parentUserId);
			if (!parentUser) {
				return NextResponse.json(
					{ error: 'Usuario padre no encontrado' },
					{ status: 404 }
				);
			}
		}

		// Procesar la imagen si existe
		let picture_url = '';
		let picture_path = '';
		if (picture) {
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

		// Crear sello en API externa solo si no es subcuenta
		let external_id = null;

		const labelToApi = {
			name,
			logo: picture_path,
			primary_genre,
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
		console.log('createLabelRes: ', createLabelRes);
		external_id = createLabelRes.id;

		// Encriptar contraseña solo si no es subcuenta
		const hashedPassword = !isSubaccount
			? await encryptPassword(password)
			: null;

		// Crear el nuevo usuario
		const newUser = new User({
			external_id,
			name,
			email: !isSubaccount ? email.toLowerCase() : undefined,
			password: hashedPassword,
			role: 'sello',
			status: 'active',
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

		// Si es subcuenta, actualizar el array de subcuentas del usuario padre
		if (isSubaccount && parentUserId) {
			await User.findByIdAndUpdate(parentUserId, {
				$push: { subaccounts: newUser._id },
			});
		}
		console.log('Guardado', newUser);

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
		console.error('Error al crear sello:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
