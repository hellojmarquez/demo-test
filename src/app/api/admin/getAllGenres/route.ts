export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
	console.log('get contributor roles received');

	try {
		// Obtener el token
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

		const genresRes = await fetch(`${process.env.MOVEMUSIC_API}/genres`, {
			headers: {
				Authorization: `JWT ${moveMusicAccessToken}`,
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
			},
		});
		const releasesRes = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/update-status`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify({
					id: 814,
					action: 'distribute',
				}),
			}
		);

		const genresData = await genresRes.json();
		const releasesData = await releasesRes.json();
		console.log('releasesData', releasesData);
		return NextResponse.json({
			success: true,
			data: genresData.results,
		});
	} catch (error) {
		console.error('Error fetching contributor generos:');
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
