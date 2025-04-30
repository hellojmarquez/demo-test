export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';

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

		const body = await req.json();

		console.log(params.id);
		// Si hay una imagen en base64, convertirla a Buffer
		if (body.picture && body.picture.base64) {
			body.picture = Buffer.from(body.picture.base64, 'base64');
		}
		const artistToApi = {
			name: body.name,
			amazon_music_identifier: body.amazon_music_identifier,
			apple_identifier: body.apple_identifier,
			deezer_identifie: body.deezer_identifie,
			spotify_identifier: body.spotify_identifier,
			email: body.email,
		};
		// Actualizar artista en la API externa
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

		// Actualizar el publisher en la base de datos local
		const updatedContributor = await User.findOneAndUpdate(
			{ external_id: params.id },
			body,
			{ runValidators: true }
		);

		if (!updatedContributor) {
			return NextResponse.json(
				{ success: false, error: 'Contributor not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error('Error updating publisher:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
