import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	console.log('get publishers roles received');

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
		// Obtener los roles
		const publishersRes = await fetch(
			`${process.env.MOVEMUSIC_API}/publishers`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);

		const publishersData = await publishersRes.json();

		return NextResponse.json({
			success: true,
			data: publishersData.results,
		});
	} catch (error) {
		console.error('Error fetching contributor roles:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
