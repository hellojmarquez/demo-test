import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
	console.log('Middleware executing for path:', request.nextUrl.pathname);

	// Rutas públicas que no requieren verificación
	const publicRoutes = ['/sello/login', '/sello/banned'];
	const isPublicRoute = publicRoutes.some(route =>
		request.nextUrl.pathname.startsWith(route)
	);

	// Si es una ruta pública, permitir el acceso
	if (isPublicRoute) {
		console.log('Public route, allowing access');
		return NextResponse.next();
	}

	// Obtener el token de login
	const loginToken = request.cookies.get('loginToken')?.value;
	console.log('Login token present:', !!loginToken);

	if (!loginToken) {
		console.log('No login token found, redirecting to login');
		return NextResponse.redirect(new URL('/sello/login', request.url));
	}

	try {
		// Verificar el token
		const { payload } = await jwtVerify(
			loginToken,
			new TextEncoder().encode(process.env.JWT_SECRET)
		);

		// Verificar si el usuario está baneado
		if (payload.status === 'banned') {
			console.log('User is banned, redirecting to banned page');
			return NextResponse.redirect(new URL('/sello/banned', request.url));
		}

		// Si no está baneado, permitir el acceso
		console.log('User authenticated and not banned, allowing access');
		return NextResponse.next();
	} catch (error) {
		console.error('Token verification failed:', error);
		return NextResponse.redirect(new URL('/sello/login', request.url));
	}
}

// Configurar el matcher para que el middleware se ejecute en todas las rutas excepto las estáticas
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
};
