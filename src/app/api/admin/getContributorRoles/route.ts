export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	console.log('get contributor roles received');

	try {
		// Obtener el token
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
	} catch (error) {
		console.error('Error fetching contributor roles:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
