import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { jwtVerify } from 'jose';

import { ObjectId } from 'mongodb';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
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
		const formData = await req.formData();

		// Obtener la imagen del FormData
		const file = formData.get('picture') as File;
		const data = JSON.parse(formData.get('data') as string);
		let picture_url = '';
		let picture_path = '';
		console.log('Datos foto:', file);
		console.log('Datos recibidos:', data);
		if (file) {
			const uploadMediaReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${file.name}&filetype=${file.type}&upload_type=label.logo`,
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
			const uploadMediaRes = await uploadMediaReq.json();
			// Extraer la URL y los campos del objeto firmado
			const { url: signedUrl, fields: trackFields } = uploadMediaRes.signed_url;
			// Crear un objeto FormData y agregar los campos y el archivo
			const mediaFormData = new FormData();
			Object.entries(trackFields).forEach(([key, value]) => {
				if (typeof value === 'string' || value instanceof Blob) {
					mediaFormData.append(key, value);
				} else {
					console.warn(
						`El valor de '${key}' no es un tipo válido para FormData:`,
						value
					);
				}
			});

			mediaFormData.append('file', file);

			// Realizar la solicitud POST a la URL firmada
			const uploadResponse = await fetch(signedUrl, {
				method: 'POST',
				body: mediaFormData,
			});
			console.log('uploadResponse: ', uploadResponse);
			picture_url = uploadResponse?.headers?.get('location') || '';
			picture_path = decodeURIComponent(new URL(picture_url).pathname.slice(1));
		}
		if (data.year) data.year = parseInt(data.year);
		if (data.external_id) data.external_id = parseInt(data.external_id);
		const dataToApi = {
			name: data.name,
			logo: picture_path,
			primary_genre: data.primary_genre,
			year: data.year,
			catalog_num: data.catalog_num,
		};
		const releaseToApi = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/${data.external_id}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify(dataToApi),
			}
		);
		const apiRes = await releaseToApi.json();

		await dbConnect();

		// Validar que el ID sea válido
		if (!ObjectId.isValid(id)) {
			return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
		}

		// Preparar los datos para la base de datos
		const dataToBBDD = {
			_id: new ObjectId(id),
			external_id: apiRes.id,
			name: data.name,
			picture: picture_url,
			primary_genre: data.primary_genre,
			year: data.year,
			subaccounts: !data.isSubaccount ? [] : undefined,
			tipo: data.isSubaccount ? 'subcuenta' : 'principal',
			catalog_num: data.catalog_num,
			parentId: data.parentId ? new ObjectId(data.parentId) : null,
			parentName: data.parentName || null,
			status: data.status,
			assigned_artists: data.assigned_artists || [],
		};

		// Actualizar en la base de datos
		const updateUser = await User.findOneAndUpdate(
			{ _id: new ObjectId(id) },
			dataToBBDD,
			{ runValidators: true }
		);
		console.log('result: ', updateUser);
		if (!updateUser) {
			return NextResponse.json(
				{ error: 'Sello no encontrado' },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error updating sello:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar el sello' },
			{ status: 500 }
		);
	}
}
