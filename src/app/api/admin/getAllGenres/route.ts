export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/utils/fetchMoveMusic';

export async function GET(req: NextRequest) {
	console.log('get contributor roles received');

	try {
		// Obtener el token
		const accessToken = await getValidAccessToken();
		const genresRes = await fetch(`${process.env.MOVEMUSIC_API}/genres`, {
			headers: {
				Authorization: `JWT ${accessToken}`,
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
			},
		});

		const genresData = await genresRes.json();

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
