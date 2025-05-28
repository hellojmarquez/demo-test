import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';

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
		const hashedPassword = await encryptPassword(password);
		const amazon_music_identifier = formData.get(
			'amazon_music_identifier'
		) as string;
		const apple_identifier = formData.get('apple_identifier') as string;
		const deezer_identifier = formData.get('deezer_identifier') as string;
		const spotify_identifier = formData.get('spotify_identifier') as string;
		const picture = formData.get('picture') as File;
		const isSubaccount = formData.get('isSubaccount') === 'true';
		const parentUserId = formData.get('parentUserId') as string;

		// Función para convertir File a base64
		const fileToBase64 = async (file: File): Promise<string> => {
			const buffer = await file.arrayBuffer();
			const base64 = Buffer.from(buffer).toString('base64');
			return base64;
		};

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
				{ success: false, error: 'El email ya está registrado' },

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
		if (!artistaReq.ok) {
			return NextResponse.json(
				{
					success: false,
					error: artistaReq.statusText || 'Error al crear el artista',
				},
				{ status: artistaReq.status }
			);
		}

		const artistaRes = await artistaReq.json();

		// Convertir la imagen a base64 si existe
		let pictureBase64 = '';
		if (picture) {
			pictureBase64 = await fileToBase64(picture);
		}
		await dbConnect();
		// Crear el nuevo artista
		const newArtist = await User.create({
			external_id: artistaRes.id,
			name,
			email,
			password: hashedPassword,
			picture: pictureBase64,
			role: 'artista',
			status: 'activo',
			permissions: ['artista'],
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
		});

		try {
			// Crear el log
			const logData = {
				action: 'CREATE' as const,
				entity: 'USER' as const,
				entityId: newArtist._id.toString(),
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
