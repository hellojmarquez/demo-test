import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
	console.log('middleware');
	// Solo procesar rutas que empiecen con /sello
	if (!request.nextUrl.pathname.startsWith('/panel')) {
		return NextResponse.next();
	}

	// Si es la ruta de login, permitir el acceso sin verificar el token
	if (request.nextUrl.pathname === '/panel/login') {
		return NextResponse.next();
	}

	// Si es la ruta de banned, permitir el acceso
	if (request.nextUrl.pathname === '/panel/banned') {
		return NextResponse.next();
	}

	// Obtener el token de login
	const loginToken = request.cookies.get('loginToken')?.value;

	if (!loginToken) {
		console.log('no loginToken');
		return NextResponse.redirect(new URL('/panel/login', request.url));
	}

	try {
		// Verificar el token
		const { payload } = await jwtVerify(
			loginToken,
			new TextEncoder().encode(process.env.JWT_SECRET)
		);

		// Verificar si el usuario está baneado
		if (payload.status === 'banneado') {
			return NextResponse.redirect(new URL('/panel/banned', request.url));
		}
		console.log('pasa prueba de payload');

		// Si no está baneado, permitir el acceso

		const AccessToken = request.cookies.get('accessToken')?.value;
		const refreshToken = request.cookies.get('refreshToken')?.value;
		if (!refreshToken && AccessToken) {
			console.log('no refreshToken y accessToken');
			return NextResponse.redirect(new URL('/panel/login', request.url));
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
				return NextResponse.redirect(new URL('/panel/login', request.url));
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
		return NextResponse.redirect(new URL('/panel/login', request.url));
	}
}

// Configurar el matcher para que el middleware se ejecute solo en las rutas de sello
export const config = {
	matcher: ['/panel/:path*'],
};
