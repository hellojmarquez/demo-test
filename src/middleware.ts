import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
	// Solo procesar rutas que empiecen con /sello
	if (!request.nextUrl.pathname.startsWith('/sello')) {
		return NextResponse.next();
	}

	console.log('Middleware executing for path:', request.nextUrl.pathname);

	// Si es la ruta de login, permitir el acceso sin verificar el token
	if (request.nextUrl.pathname === '/sello/login') {
		console.log('Login route, allowing access');
		return NextResponse.next();
	}

	// Si es la ruta de banned, permitir el acceso
	if (request.nextUrl.pathname === '/sello/banned') {
		console.log('Banned route, allowing access');
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
		if (payload.status === 'banneado') {
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

// Configurar el matcher para que el middleware se ejecute solo en las rutas de sello
export const config = {
	matcher: ['/sello/:path*'],
};
