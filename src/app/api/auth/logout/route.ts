import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	const response = NextResponse.json({ message: 'Logout successful' });

	// Lista de cookies a eliminar
	const cookiesToDelete = [
		'userId',
		'refreshToken',
		'next-auth.csrf-token',
		'next-auth.callback-url',
		'loginToken',
		'accessToken',
	];

	// Eliminar cada cookie
	cookiesToDelete.forEach(cookieName => {
		response.cookies.set({
			name: cookieName,
			value: '',
			expires: new Date(0),
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
			domain:
				process.env.NODE_ENV === 'production'
					? process.env.COOKIE_DOMAIN
					: undefined,
		});
	});

	return response;
}
