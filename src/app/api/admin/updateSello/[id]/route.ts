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

		await dbConnect();

		// Obtener el sello actual para comparar cambios
		const currentSello = await User.findById(id);
		if (!currentSello) {
			return NextResponse.json(
				{ error: 'Sello no encontrado' },
				{ status: 404 }
			);
		}

		let data: any;
		let file: File | null = null;

		// Determinar si la solicitud es FormData o JSON
		const contentType = req.headers.get('content-type') || '';
		if (contentType.includes('multipart/form-data')) {
			const formData = await req.formData();
			file = formData.get('picture') as File;
			data = JSON.parse(formData.get('data') as string);
		} else if (contentType.includes('application/json')) {
			data = await req.json();
		} else {
			return NextResponse.json(
				{ error: 'Content-Type no soportado' },
				{ status: 400 }
			);
		}

		// Preparar los datos para la actualización
		const updateData: any = {
			name: data.name,
			primary_genre: data.primary_genre,
			year: parseInt(data.year),
			catalog_num: parseInt(data.catalog_num),
			status: data.status,
			assigned_artists: data.assigned_artists || [],
			tipo: data.tipo,
		};
		console.log('recibido: ', updateData);
		// Manejar la imagen si se proporciona una nueva
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
			const { url: signedUrl, fields: mediaFields } = uploadMediaRes.signed_url;
			const mediaFormData = new FormData();
			Object.entries(mediaFields).forEach(([key, value]) => {
				if (typeof value === 'string' || value instanceof Blob) {
					mediaFormData.append(key, value);
				}
			});
			mediaFormData.append('file', file);
			const uploadResponse = await fetch(signedUrl, {
				method: 'POST',
				body: mediaFormData,
			});
			const picture_url = uploadResponse?.headers?.get('location') || '';
			updateData.picture = picture_url;
		}

		// Manejar cambios en las subcuentas
		if (data.tipo === 'principal') {
			// Obtener las subcuentas actuales y las nuevas
			const currentSubaccounts = currentSello.subaccounts || [];
			const newSubaccounts = data.subaccounts || [];

			// Encontrar subcuentas removidas
			const removedSubaccounts = currentSubaccounts.filter(
				(sub: string) =>
					!newSubaccounts.some((newSub: { _id: string }) => newSub._id === sub)
			);

			// Encontrar subcuentas agregadas
			const addedSubaccounts = newSubaccounts.filter(
				(newSub: { _id: string }) => !currentSubaccounts.includes(newSub._id)
			);

			// Actualizar las subcuentas removidas
			for (const subId of removedSubaccounts) {
				await User.findByIdAndUpdate(subId, {
					parentId: null,
					parentName: null,
				});
			}

			// Actualizar las subcuentas agregadas
			for (const sub of addedSubaccounts) {
				await User.findByIdAndUpdate(sub._id, {
					parentId: id,
					parentName: data.name,
				});
			}

			// Actualizar el array de subcuentas
			updateData.subaccounts = newSubaccounts.map(
				(sub: { _id: string }) => sub._id
			);
		} else if (data.tipo === 'subcuenta') {
			// Si es una subcuenta, actualizar parentId y parentName
			updateData.parentId = data.parentId;
			updateData.parentName = data.parentName;
			updateData.subaccounts = undefined; // Las subcuentas no pueden tener subcuentas
		}

		// Actualizar el sello
		const updatedSello = await User.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		});

		if (!updatedSello) {
			return NextResponse.json(
				{ error: 'Error al actualizar el sello' },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			data: updatedSello,
		});
	} catch (error) {
		console.error('Error updating sello:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar el sello' },
			{ status: 500 }
		);
	}
}
