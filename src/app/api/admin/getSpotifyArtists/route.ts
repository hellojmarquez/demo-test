import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
export async function POST(req: NextRequest) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
		const spotify_tokeen = req.cookies.get('stkn')?.value;
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

		const SPOTIFY_ARTIST_REQ = await fetch(
			`${process.env.SPOTIFY_API}/search?q=${encodeURIComponent(
				query
			)}&type=artist&limit=10`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${spotify_tokeen}`,
				},
			}
		);

		if (!SPOTIFY_ARTIST_REQ.ok) {
			console.log('error al solicitar artistas de spotify');
			return NextResponse.json(
				{
					success: false,
					error: 'error al solicitar artistas de spotify',
				},
				{ status: 400 }
			);
		}
		const SPOTIFY_ARTIST_RES = await SPOTIFY_ARTIST_REQ.json();
		const artists =
			SPOTIFY_ARTIST_RES.artists?.items?.map((artist: any) => ({
				value: artist.name,
				label: artist.name,
				id: artist.id,
				url: artist.external_urls?.spotify,
				image: artist.images?.[0]?.url,
				followers: artist.followers?.total,
				popularity: artist.popularity,
			})) || [];

		return NextResponse.json({
			success: true,
			data: artists,
			total: artists.artists?.total || 0,
		});
	} catch (err) {
		return NextResponse.json(
			{
				success: false,
				error: 'Error al obtener los artistas de Spotify',
			},
			{ status: 500 }
		);
	}
}
