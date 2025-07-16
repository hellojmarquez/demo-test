export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT y obtener el payload
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
		const tokenRes = await fetch(
			`${process.env.MOVEMUSIC_API}/auth/obtain-token/`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify({
					username: process.env.MOVEMUSIC_USERNAME || '',
					password: process.env.MOVEMUSIC_PASSWORD || '',
				}),
			}
		);

		const tokenData = await tokenRes.json();

		if (!tokenData.access) {
			return NextResponse.json(
				{ success: false, error: 'No access token received' },
				{ status: 401 }
			);
		}

		// Obtener los roles
		const rolesRes = await fetch(
			`${process.env.MOVEMUSIC_API}/contributor-roles`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${tokenData.access}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);

		const rolesData = await rolesRes.json();

		return NextResponse.json({
			success: true,
			data: rolesData.results,
		});
	} catch (error: any) {
		console.error('Error fetching contributor roles:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
