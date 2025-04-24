import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/utils/fetchMoveMusic';

export async function GET(req: NextRequest) {
	console.log('get all sellos received');

	try {
		// Obtener el token
		const accessToken = await getValidAccessToken();
		const sellosData = await fetch(
			`${process.env.MOVEMUSIC_API}/labels/?search=sello&ordering=name&page=1&page_size=20`,
			{
				headers: {
					Authorization: `JWT ${accessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);
		const sellosRes = await sellosData.json();
		return NextResponse.json({
			success: true,
			data: sellosRes.results,
		});
	} catch (error) {
		console.error('Error fetching contributor roles:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
