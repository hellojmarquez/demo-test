// app/api/admin/createProduct/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SelloModel from '@/models/SelloModel';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
	console.log('create sello request received');
	try {
		const token = req.cookies.get('loginToken')?.value;
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		console.log(moveMusicAccessToken);
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

		// Obtener los datos como JSON
		const formData = await req.formData();

		// Extraer valores del FormData
		const name = formData.get('name') as string;
		const logo = formData.get('picture') as File;
		const year = formData.get('year') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const role = formData.get('role') as string;
		const catalogNum = formData.get('catalog_num') as string;
		const primaryGenreStr = formData.get('primary_genre');

		//obtener el objeto de genero musical
		let primaryGenre = null;
		if (primaryGenreStr && typeof primaryGenreStr === 'string') {
			try {
				primaryGenre = JSON.parse(primaryGenreStr);
			} catch (error) {
				console.error('Error al parsear el género:', error);
			}
		}

		// solicitar subida de logo
		const uploadLogoReq = await fetch(
			`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${logo.name}&filetype=${logo.type}&upload_type=label.logo`,
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
		const uploadLogoRes = await uploadLogoReq.json();

		// Extraer la URL y los campos del objeto firmado
		const { url, fields } = uploadLogoRes.signed_url;

		// Crear un objeto FormData y agregar los campos y el archivo
		const logoFormData = new FormData();
		Object.entries(fields).forEach(([key, value]) => {
			if (typeof value === 'string' || value instanceof Blob) {
				logoFormData.append(key, value);
			} else {
				console.warn(
					`El valor de '${key}' no es un tipo válido para FormData:`,
					value
				);
			}
		});

		logoFormData.append('file', logo); // 'logo' es el archivo que deseas subir

		// Realizar la solicitud POST a la URL firmada
		const uploadResponse = await fetch(url, {
			method: 'POST',
			body: logoFormData,
		});

		// Verificar si la subida fue exitosa
		if (!uploadResponse.ok) {
			console.error(
				'Error al subir el logo a S3:',
				await uploadResponse.text()
			);
			return NextResponse.json(
				{ success: false, error: 'Error al subir el logo a S3' },
				{ status: 500 }
			);
		}

		// Obtener la URL pública del logo subido
		const logoUrl = uploadLogoRes.url;
		const fileName = logoUrl.split('/').pop();

		// Crear un objeto limpio con solo los datos necesarios para la API externa
		const selloDataForApi = {
			name,
			logo: `label/logo/${fileName}`,
			year: parseInt(year) || null,
			primary_genre: primaryGenre.name,
			catalog_num: catalogNum,
		};
		// Enviar datos a la API externa
		const selloToApi = await fetch(`${process.env.MOVEMUSIC_API}/labels/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
				Authorization: `JWT ${moveMusicAccessToken}`,
			},
			body: JSON.stringify(selloDataForApi),
		});

		const apiResponse = await selloToApi.json();
		console.log(apiResponse);

		const externalId =
			typeof apiResponse.id === 'string'
				? parseInt(apiResponse.id, 10)
				: apiResponse.id;

		// Crear un objeto para MongoDB que puede incluir más información
		const selloDataForDDBB = {
			external_id: externalId,
			name,
			email,
			password,
			role,
			picture: logoUrl,
			primary_genre_id: primaryGenre.id,
			primary_genre_name: primaryGenre.name,
			year: parseInt(year),
			catalog_num: catalogNum,
			created_at: new Date(),
			subaccounts: [],
			assigned_artists: [],
		};

		// Guardar en MongoDB
		const newSello = new SelloModel(selloDataForDDBB);
		await newSello.save();

		return NextResponse.json(
			{
				success: true,
				message: 'Sello created successfully',
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error creating sello:', error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'Internal Server Error',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
