import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User, Sello } from '@/models/UserModel';
import { jwtVerify } from 'jose';
import { encryptPassword } from '@/utils/auth';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
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
		const { id } = params;
		await dbConnect();
		console.log('id: ', id);
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

		let picture_url = '';
		let picture_path = '';

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
		let updateData: any = {
			name: data.name,
			primary_genre: data.primary_genre,
			year: parseInt(data.year),
			catalog_num: parseInt(data.catalog_num),
			status: data.status,
			logo: decodeURIComponent(new URL(data.picture).pathname.slice(1)),
			assigned_artists: data.assigned_artists || [],
		};

		console.log('recibido: ', data);
		// Manejar la imagen si se proporciona una nueva
		if (file) {
			console.log('Subiendo nueva imagen...');
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
			picture_url = uploadResponse?.headers?.get('location') || '';
			picture_path = decodeURIComponent(new URL(picture_url).pathname.slice(1));
			updateData.logo = picture_path;
			console.log('Nueva URL de imagen generada:', picture_url);
			console.log('Nueva ruta de imagen para API:', picture_path);
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
		const externalApiRes = await fetch(
			`${process.env.MOVEMUSIC_API}/labels/${data.external_id}`,
			{
				method: 'PUT',
				body: JSON.stringify(updateData),
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);
		const externalApiResJson = await externalApiRes.json();
		if (!externalApiResJson.id) {
			console.log('externalApiResJson: ', externalApiResJson);
			return NextResponse.json(
				{
					success: false,
					error:
						externalApiRes.statusText ||
						'Ha habido un error, estamos trabajando en ello',
				},
				{ status: 400 }
			);
		}

		if (data.password) {
			data.password = await encryptPassword(data.password);
		}
		delete updateData.logo;
		const dataToBBDD = {
			...updateData,
			email: data.email,
			password: data.password,
			subaccounts: data.subaccounts,
			tipo: data.tipo,
			parentId: data.parentId,
			parentName: data.parentName,
			picture: data.picture,
		};
		file && (dataToBBDD.picture = picture_url);
		console.log('datos a BD:', dataToBBDD);

		// Actualizar el sello
		const updatedSello = await Sello.findOneAndUpdate(
			{ external_id: data.external_id },
			{
				$set: {
					...dataToBBDD,
					primary_genre: data.primary_genre,
				},
			},
			{
				new: true,
				runValidators: true,
			}
		);
		console.log('updatedSello: ', updatedSello);
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
