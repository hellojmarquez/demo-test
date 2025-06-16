import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
	console.log('middleware');
	// Solo procesar rutas que empiecen con /api/admin
	if (!request.nextUrl.pathname.startsWith('/api/admin')) {
		return NextResponse.next();
	}

	// Si es la ruta de login, permitir el acceso sin verificar el token
	if (request.nextUrl.pathname === '/api/admin/login') {
		return NextResponse.next();
	}

	// Obtener el token del header Authorization
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return new NextResponse(
			JSON.stringify({ success: false, error: 'No token provided' }),
			{
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	const token = authHeader.split(' ')[1];

	try {
		// Verificar el token
		const { payload } = await jwtVerify(
			token,
			new TextEncoder().encode(process.env.JWT_SECRET)
		);

		// Verificar si el usuario está baneado
		if (payload.status === 'banneado') {
			return new NextResponse(
				JSON.stringify({ success: false, error: 'User is banned' }),
				{
					status: 403,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}
		const AccessToken = request.cookies.get('accessToken')?.value;
		const refreshToken = request.cookies.get('refreshToken')?.value;
		if (!refreshToken && AccessToken) {
			return new NextResponse(
				JSON.stringify({ success: false, error: 'Accesso no autorizado' }),
				{
					status: 401,
					statusText: 'Accesso no autorizado',
				}
			);
		}

		const verifyToken = await fetch(
			`${process.env.MOVEMUSIC_API}/auth/verify-token/`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify({
					token: AccessToken,
				}),
			}
		);

		if (!verifyToken.ok) {
			console.log('token expired');
			const refreshToken = await fetch(
				`${process.env.MOVEMUSIC_API}/auth/refresh-token/`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
						Referer: process.env.MOVEMUSIC_REFERER || '',
					},
					body: JSON.stringify({
						token: AccessToken,
					}),
				}
			);
			if (!refreshToken.ok) {
				console.log('no refreshToken');
				return new NextResponse(
					JSON.stringify({ success: false, error: 'Accesso no autorizado' }),
					{
						status: 401,
						statusText: 'Accesso no autorizado',
					}
				);
			}
			const refreshTokenData = await refreshToken.json();
			const response = NextResponse.next();

			// Establecer la cookie en la respuesta
			response.cookies.set({
				name: 'accessToken',
				value: refreshTokenData.access,
				maxAge: 60 * 60 * 24 * 3,
			});
			return response;
		}
		return NextResponse.next();
	} catch (error) {
		console.error('Token verification failed:', error);
		return new NextResponse(JSON.stringify({ error: 'Invalid token' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

// Configurar el matcher para que el middleware se ejecute solo en las rutas de api/admin
export const config = {
	matcher: ['/api/admin/:path*'],
};
