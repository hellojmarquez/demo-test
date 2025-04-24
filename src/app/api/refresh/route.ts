import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	try {
		const refreshToken = req.cookies.get('move-refresh')?.value;

		if (!refreshToken) {
			return NextResponse.json(
				{ error: 'No refresh token found' },
				{ status: 401 }
			);
		}

		// Hacer petición a la API de MoveMusic para renovar el access token
		const res = await fetch(process.env.MOVEMUSIC_REFRESH_API || '', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
			},
			body: JSON.stringify({ refresh: refreshToken }),
		});

		const data = await res.json();

		if (!data.access) {
			return NextResponse.json(
				{ error: 'Invalid refresh token' },
				{ status: 401 }
			);
		}

		const response = NextResponse.json({ message: 'Access token refreshed' });

		// Guardar el nuevo access token en la cookie
		response.cookies.set({
			name: 'move-access',
			value: data.access,
			path: '/',
			maxAge: 60 * 60, // 1 hora
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
		});

		return response;
	} catch (err) {
		console.error('Error refreshing token:', err);
		return NextResponse.json(
			{ error: 'Failed to refresh token' },
			{ status: 500 }
		);
	}
}
