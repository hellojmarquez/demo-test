import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import { v4 as uuidv4 } from 'uuid';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
	console.log('create ARTISTA DEESDE RELEASE request received');

	const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
	const token = req.cookies.get('loginToken')?.value;
	console.log('token: ', token);
	if (!token) {
		return NextResponse.json(
			{ success: false, error: 'Not authenticated' },
			{ status: 401 }
		);
	}
	try {
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

		const artist = await req.json();
		console.log('artist', artist);
		// Extraer los campos del FormData
		const order = artist.order || 0;
		const kind = artist.kind;
		let name = artist.name;
		let email = artist.email;
		const amazon_music_identifier = artist.amazon_music_identifier;
		const apple_identifier = artist.apple_identifier;
		const deezer_identifier = artist.deezer_identifier;
		const spotify_identifier = artist.spotify_identifier;

		// Validar campos requeridos
		if (!name) {
			return NextResponse.json(
				{ message: 'Nombre contraseña requerido' },
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
		console.log('artistaRes: ', artistaRes);
		// Crear el nuevo artista
		const newArtist = await User.create({
			external_id: artistaRes.id,
			name,
			email,
			password: uuidv4(),
			picture: '',
			role: 'artista',
			status: 'active',
			permissions: ['artista'],
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
			isSubaccount: false,
			parentId: null,
			parentName: null,
			tipo: 'principal',
		});
		console.log('newArtist: ', newArtist);
		return NextResponse.json({
			success: true,
			artist: {
				id: artistaRes.id,
				kind,
				name,
				order,
			},
		});
	} catch (error) {
		console.error('Error creating artist:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
