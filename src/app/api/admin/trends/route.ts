export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
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

		// Obtener los parámetros de query
		const { searchParams } = new URL(req.url);
		const page = searchParams.get('page');
		const page_size = searchParams.get('page_size');
		const release = searchParams.get('release');
		const store = searchParams.get('store');
		const period = searchParams.get('period');

		// Construir los parámetros para la API externa
		const apiParams = new URLSearchParams();
		if (page) apiParams.append('page', page);
		if (page_size) apiParams.append('page_size', page_size);
		if (release) apiParams.append('release', release);
		if (store) apiParams.append('store', store);
		if (period) apiParams.append('period', period);

		// Construir la URL con parámetros
		const apiUrl = `${process.env.MOVEMUSIC_API}/trends/${
			apiParams.toString() ? `?${apiParams.toString()}` : ''
		}`;

		const trendsReq = await fetch(apiUrl, {
			headers: {
				Authorization: `JWT ${moveMusicAccessToken}`,
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
			},
		});

		if (!trendsReq.ok) {
			const trendsRes = await trendsReq.json();
			return NextResponse.json(
				{
					success: false,
					error: trendsRes || 'ha habido un error al obtener los trends',
				},
				{ status: 400 }
			);
		}
		const trendsRes = await trendsReq.json();

		return NextResponse.json({ success: true, data: trendsRes });
	} catch (error: any) {
		console.error('Error fetching contributor generos:');
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
