import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
export async function POST(req: NextRequest) {
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
		const { query } = await req.json();

		const ARTIST_REQ = await fetch(
			`${process.env.DEEZER_API}/search/artist?q=${query}&type=artist&limit=10`
		);

		if (!ARTIST_REQ.ok) {
			console.log('error al solicitar artistas de Dezeer');
			return NextResponse.json({
				success: false,
				error: 'error al solicitar artistas de Dezeer',
			});
		}
		const ARTIST_RES = await ARTIST_REQ.json();
		const artists =
			ARTIST_RES?.data.map((artist: any) => ({
				value: artist.name,
				label: artist.name,
				id: artist.id,
				url: artist.link,
				image: artist.picture_small,
				followers: artist.nb_fan,
				popularity: 0,
			})) || [];

		return NextResponse.json({
			success: true,
			data: artists,
			total: artists?.total || 0,
		});
	} catch (err) {
		return NextResponse.json(
			{
				success: false,
				error: 'Error al obtener los artistas de Dezeer',
			},
			{ status: 500 }
		);
	}
}
