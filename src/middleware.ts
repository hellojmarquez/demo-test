import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
	// ===== LÓGICA PARA FRONTEND (/panel) =====
	if (request.nextUrl.pathname.startsWith('/panel')) {
		// Si es la ruta de login, permitir el acceso sin verificar el token
		if (request.nextUrl.pathname === '/panel/login') {
			return NextResponse.next();
		}

		// Si es la ruta de banned, permitir el acceso
		if (request.nextUrl.pathname === '/panel/banned') {
			return NextResponse.next();
		}

		// Para todas las demás rutas de panel, verificar autenticación
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
				const isProd = process.env.NODE_ENV === 'production';
				const sameSite = isProd ? 'none' : 'lax';
				const cookieDomain = isProd ? process.env.COOKIE_DOMAIN : undefined;

				response.cookies.set({
					name: 'accessToken',
					value: refreshTokenData.access,
					maxAge: 60 * 60 * 24 * 3,
					httpOnly: true,
					path: '/',
					secure: isProd,
					sameSite: sameSite,
					domain: cookieDomain,
				});
				return response;
			}

			return NextResponse.next();
		} catch (error) {
			console.error('Token verification failed:', error);
			return NextResponse.redirect(new URL('/panel/login', request.url));
		}
	}

	// ===== LÓGICA PARA BACKEND (/api/admin) =====
	if (!request.nextUrl.pathname.startsWith('/api/admin')) {
		return NextResponse.next();
	}

	// Si es la ruta de login, permitir el acceso sin verificar el token
	if (request.nextUrl.pathname === '/api/admin/login') {
		return NextResponse.next();
	}

	// Para rutas API, usar cookies en lugar de header Authorization
	const loginToken = request.cookies.get('loginToken')?.value;

	if (!loginToken) {
		return new NextResponse(
			JSON.stringify({ success: false, error: 'No token provided' }),
			{
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	const response = NextResponse.next();
	const isProd = process.env.NODE_ENV === 'production';
	const sameSite = isProd ? 'none' : 'lax';
	const cookieDomain = isProd ? process.env.COOKIE_DOMAIN : undefined;

	try {
		// Verificar el token JWT
		const { payload } = await jwtVerify(
			loginToken,
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

		// Verificar AccessToken y refreshToken
		const AccessToken = request.cookies.get('accessToken')?.value;
		const refreshToken = request.cookies.get('refreshToken')?.value;

		if (!refreshToken && AccessToken) {
			return new NextResponse(
				JSON.stringify({ success: false, error: 'Accesso no tokens' }),
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
					JSON.stringify({ success: false, error: 'Accesso no Refresh' }),
					{
						status: 401,
						statusText: 'Accesso no autorizado',
					}
				);
			}
			const refreshTokenData = await refreshToken.json();

			// Establecer la cookie en la respuesta
			response.cookies.set({
				name: 'accessToken',
				value: refreshTokenData.access,
				maxAge: 60 * 60 * 24 * 3,
				httpOnly: true,
				path: '/',
				secure: isProd,
				sameSite: sameSite,
				domain: cookieDomain,
			});
			return response;
		}

		// Verificar si necesita token de Spotify (después de autenticación)
		if (request.nextUrl.pathname.startsWith('/api/admin/getSpotifyArtists')) {
			const existingSpotifyToken = request.cookies.get('stkn')?.value;
			if (!existingSpotifyToken) {
				const dataToSpotify = new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: process.env.SPOTIFY_CLIENT_ID || '',
					client_secret: process.env.SPOTIFY_CLIENT_SECRET || '',
				});
				const spotifyReq = await fetch(
					`${process.env.SPOTIFY_ACCOUNTS}/token`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: dataToSpotify,
					}
				);
				if (!spotifyReq.ok) {
					console.log('error al obtener el token de Spotify');
					return NextResponse.json(
						{ success: false, error: 'Error al obtener el token de Spotify' },
						{ status: 400 }
					);
				}
				const spotifyData = await spotifyReq.json();

				response.cookies.set({
					name: 'stkn',
					value: spotifyData.access_token,
					maxAge: 60 * 60,
					httpOnly: true,
					path: '/',
					secure: isProd,
					sameSite: sameSite,
					domain: cookieDomain,
				});
			}
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

// Configurar el matcher para que el middleware se ejecute en panel y api/admin
export const config = {
	matcher: ['/panel/:path*', '/api/admin/:path*'],
};
