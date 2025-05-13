import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
	console.log('create artist request received');

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
		let name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const amazon_music_identifier = formData.get(
			'amazon_music_identifier'
		) as string;
		const apple_identifier = formData.get('apple_identifier') as string;
		const deezer_identifier = formData.get('deezer_identifier') as string;
		const spotify_identifier = formData.get('spotify_identifier') as string;
		const picture = formData.get('picture') as File | null;
		const isSubaccount = formData.get('isSubaccount') === 'true';
		const parentUserId = formData.get('parentUserId') as string;
		const parentName = formData.get('parentName') as string;
		const tipo = formData.get('tipo') as string;

		// Validar campos requeridos
		if (!name || !email || !password) {
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
			try {
				const arrayBuffer = await picture.arrayBuffer();
				pictureBuffer = Buffer.from(arrayBuffer);
				console.log('Image converted to buffer successfully');
			} catch (error) {
				console.error('Error converting image to buffer:', error);
				return NextResponse.json(
					{ message: 'Error al procesar la imagen' },
					{ status: 400 }
				);
			}
		}

		name = name
			.split(' ')
			.map(
				(word: string) =>
					word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			)
			.join(' ');

		const artistToApi = {
			name,
			email,
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
		};

		const artistaReq = await fetch(`${process.env.MOVEMUSIC_API}/artists/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `JWT ${moveMusicAccessToken}`,
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
			},
			body: JSON.stringify(artistToApi),
		});

		const artistaRes = await artistaReq.json();

		// Crear el nuevo artista
		const newArtist = await User.create({
			external_id: artistaRes.id,
			name,
			email,
			password,
			picture: pictureBuffer,
			role: 'artista',
			status: 'active',
			permissions: ['artista'],
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
			isSubaccount,
			parentId: isSubaccount ? parentUserId : null,
			parentName: isSubaccount ? parentName : null,
			tipo: tipo || 'principal',
		});

		// Si es una subcuenta, actualizar el usuario padre
		if (isSubaccount && parentUserId) {
			await User.findByIdAndUpdate(parentUserId, {
				$push: { subaccounts: newArtist._id },
			});
		}

		return NextResponse.json({
			success: true,
			artist: newArtist,
		});
	} catch (error) {
		console.error('Error creating artist:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
