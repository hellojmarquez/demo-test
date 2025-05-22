export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Artista } from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';

interface UpdateArtistBody {
	name: string;
	email: string;
	password?: string;
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
	role: string;
	picture?: string;
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	console.log('updateArtist endpoint');
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

		const contentType = req.headers.get('content-type');
		let body: UpdateArtistBody;
		if (contentType?.includes('multipart/form-data')) {
			const formData = await req.formData();
			const password = formData.get('password') as string;

			body = {
				name: formData.get('name') as string,
				email: formData.get('email') as string,
				amazon_music_identifier: formData.get(
					'amazon_music_identifier'
				) as string,
				apple_identifier: formData.get('apple_identifier') as string,
				deezer_identifier: formData.get('deezer_identifier') as string,
				spotify_identifier: formData.get('spotify_identifier') as string,
				role: 'artista',
			};

			// Solo encriptar password si se proporcionó uno
			if (password) {
				const encryptedPassword = await encryptPassword(password);
				body.password = encryptedPassword;
			}

			// Procesar la imagen si existe
			const picture = formData.get('picture') as File | null;
			if (picture) {
				const arrayBuffer = await picture.arrayBuffer();
				const base64String = Buffer.from(arrayBuffer).toString('base64');
				body.picture = base64String;
			}
			console.log('bod formdata', body);
		} else {
			body = await req.json();
			body.role = 'artista';

			// Si hay password en el JSON, encriptarlo
			if (body.password) {
				body.password = await encryptPassword(body.password);
			}
			console.log('bod json', body);
		}

		// Validar datos requeridos
		if (!body.name || !body.email) {
			return NextResponse.json(
				{ success: false, error: 'Name and email are required' },
				{ status: 400 }
			);
		}

		// Actualizar artista en la API externa
		const artistToApi = {
			name: body.name,
			amazon_music_identifier: body.amazon_music_identifier || '',
			apple_identifier: body.apple_identifier || '',
			deezer_identifier: body.deezer_identifier || '',
			spotify_identifier: body.spotify_identifier || '',
			email: body.email,
		};

		const artistReq = await fetch(
			`${process.env.MOVEMUSIC_API}/artists/${params.id}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify(artistToApi),
			}
		);
		const apiRes = await artistReq.json();

		if (!artistReq.ok) {
			const errorData = await artistReq.json();
			return NextResponse.json(
				{
					success: false,
					error: errorData.message || 'Failed to update artist in external API',
				},
				{ status: artistReq.status }
			);
		}

		// Conectar a la base de datos local
		await dbConnect();
		console.log('body to send', body);

		// Preparar el objeto de actualización
		const updateData = {
			...body,
			// Asegurarnos de que los identificadores vacíos sean strings vacíos
			amazon_music_identifier: body.amazon_music_identifier || '',
			apple_identifier: body.apple_identifier || '',
			deezer_identifier: body.deezer_identifier || '',
			spotify_identifier: body.spotify_identifier || '',
		};

		// Actualizar el usuario en la base de datos local
		const updatedArtist = await Artista.findOneAndUpdate(
			{ external_id: params.id },
			{ $set: updateData },
			{ new: true, runValidators: true }
		);

		if (!updatedArtist) {
			return NextResponse.json(
				{ success: false, error: 'Artist not found' },
				{ status: 404 }
			);
		}
		console.log('updatedArtist', updatedArtist);
		return NextResponse.json({
			success: true,
			artist: updatedArtist,
		});
	} catch (error) {
		console.error('Error updating artist:', error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Internal Server Error',
			},
			{ status: 500 }
		);
	}
}
