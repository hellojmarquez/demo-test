export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';

interface UpdateArtistBody {
	name: FormDataEntryValue | null;
	email: FormDataEntryValue | null;
	password: FormDataEntryValue | null;
	amazon_music_identifier: FormDataEntryValue | null;
	apple_identifier: FormDataEntryValue | null;
	deezer_identifier: FormDataEntryValue | null;
	spotify_identifier: FormDataEntryValue | null;
	role: string;
	picture?: Buffer;
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

		const contentType = req.headers.get('content-type');
		let body: UpdateArtistBody;

		if (contentType?.includes('multipart/form-data')) {
			const formData = await req.formData();
			body = {
				name: formData.get('name'),
				email: formData.get('email'),
				password: formData.get('password'),
				amazon_music_identifier: formData.get('amazon_music_identifier'),
				apple_identifier: formData.get('apple_identifier'),
				deezer_identifier: formData.get('deezer_identifier'),
				spotify_identifier: formData.get('spotify_identifier'),
				role: 'artista',
			};

			// Procesar la imagen si existe
			const picture = formData.get('picture') as File | null;
			if (picture) {
				const arrayBuffer = await picture.arrayBuffer();
				body.picture = Buffer.from(arrayBuffer);
			}
		} else {
			body = await req.json();
			body.role = 'artista';
		}

		console.log('update: ', body);

		// Actualizar artista en la API externa
		const artistToApi = {
			name: body.name,
			amazon_music_identifier: body.amazon_music_identifier,
			apple_identifier: body.apple_identifier,
			deezer_identifier: body.deezer_identifier,
			spotify_identifier: body.spotify_identifier,
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

		const artistRes = await artistReq.json();
		console.log(artistRes);

		// Conectar a la base de datos local
		await dbConnect();

		// Actualizar el usuario en la base de datos local
		const updatedArtist = await User.findOneAndUpdate(
			{ external_id: params.id },
			{ $set: body },
			{ new: true, runValidators: true }
		);

		if (!updatedArtist) {
			return NextResponse.json(
				{ success: false, error: 'Artist not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			artist: updatedArtist,
		});
	} catch (error) {
		console.error('Error updating artist:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
