// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
	console.log('=== MIDDLEWARE START ===');
	console.log('Request URL:', request.url);
	console.log('Request pathname:', request.nextUrl.pathname);

	const loginToken = request.cookies.get('loginToken')?.value;
	console.log('Login token exists:', !!loginToken);
	if (loginToken) {
		console.log('Token length:', loginToken.length);
		console.log('Token first 20 chars:', loginToken.substring(0, 20));
	}

	const isAdminRoute =
		request.nextUrl.pathname.startsWith('/sello/cuentas') ||
		request.nextUrl.pathname.startsWith('/sello/contabilidad');
	console.log('Is admin route:', isAdminRoute);

	// Si no hay token y es una ruta protegida, redirigir al login
	if (
		!loginToken &&
		(isAdminRoute || request.nextUrl.pathname.startsWith('/sello'))
	) {
		console.log('No token found, redirecting to login');
		return NextResponse.redirect(new URL('/login', request.url));
	}

	if (isAdminRoute && loginToken) {
		if (!process.env.JWT_SECRET) {
			console.error('JWT_SECRET is not defined in environment variables');
			return NextResponse.redirect(new URL('/login', request.url));
		}

		try {
			const secret = new TextEncoder().encode(process.env.JWT_SECRET);
			console.log('Secret encoded length:', secret.length);

			console.log('Attempting to verify token...');
			const { payload } = await jwtVerify(loginToken, secret);
			console.log('Token verified successfully');
			console.log('Token payload:', payload);
			console.log('User role:', payload.role);

			if (payload.role !== 'admin') {
				console.log('User is not admin, redirecting to sello');
				return NextResponse.redirect(new URL('/sello', request.url));
			}

			console.log('Access granted to admin route');
			return NextResponse.next();
		} catch (error: any) {
			console.error('Error details:', {
				name: error?.name,
				message: error?.message,
				stack: error?.stack,
			});
			return NextResponse.redirect(new URL('/login', request.url));
		}
	}

	console.log('=== MIDDLEWARE END ===');
	return NextResponse.next();
}

export const config = {
	matcher: ['/sello/:path*'],
};
