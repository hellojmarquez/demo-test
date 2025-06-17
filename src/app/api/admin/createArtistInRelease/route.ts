import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import { v4 as uuidv4 } from 'uuid';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';
export async function POST(req: NextRequest) {
	console.log('create ARTISTA DEESDE RELEASE request received');

	const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
	const token = req.cookies.get('loginToken')?.value;

	if (!token) {
		return NextResponse.json(
			{ success: false, error: 'Not authenticated' },
			{ status: 401 }
		);
	}
	try {
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

		await dbConnect();

		const artist = await req.json();

		// Extraer los campos del FormData
		const order = artist.order || 0;
		const kind = artist.kind;
		let name = artist.name.trim();
		let email = artist.email.trim();
		const amazon_music_identifier = artist.amazon_music_identifier.trim();
		const apple_identifier = artist.apple_identifier.trim();
		const deezer_identifier = artist.deezer_identifier.trim();
		const spotify_identifier = artist.spotify_identifier.trim();

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

		// Crear el nuevo artista
		const artistData = {
			_id: new mongoose.Types.ObjectId(),
			external_id: artistaRes.id,
			name,
			email,
			password: uuidv4(),
			picture: '',
			role: 'artista',
			status: 'activo',
			permissions: ['artista'],
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
			isSubaccount: false,
			parentId: null,
			parentName: null,
			tipo: 'principal',
		};
		let newId;
		try {
			const newArtist = new User(artistData);
			const savedArtist = await newArtist.save();
			newId = savedArtist._id.toString();
		} catch (error) {
			console.error('Error al crear el artista:', error);
			return NextResponse.json(
				{
					success: false,
					error: error || 'Error al crear el artista',
				},
				{ status: 500 }
			);
		}

		try {
			// Crear el log
			const logData = {
				action: 'CREATE' as const,
				entity: 'USER' as const,
				entityId: newId.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Artista creado: ${name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json({
			success: true,
			artist: {
				order,
				artist: artistaRes.id,
				kind,
				name,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
