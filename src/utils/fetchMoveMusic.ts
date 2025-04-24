import { cookies } from 'next/headers';

export async function getValidAccessToken(): Promise<string | null> {
	const cookieStore = cookies();
	const access = cookieStore.get('accessToken')?.value;
	const refresh = cookieStore.get('refreshToken')?.value;

	if (!access || !refresh) return null;

	// Probar si el access funciona
	const test = await fetch(`${process.env.MOVEMUSIC_API}/artists`, {
		headers: {
			Authorization: `JWT ${access}`,
			'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
			Referer: process.env.MOVEMUSIC_REFERER || '',
		},
	});

	if (test.ok) return access;

	// Si expiró, refrescar
	const res = await fetch(`${process.env.MOVEMUSIC_API}/auth/refresh-token/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refresh }),
	});

	const data = await res.json();
	if (!data.access) return null;

	// Actualizar cookie
	cookieStore.set('accessToken', data.access, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
		maxAge: 2 * 60 * 60,
		domain:
			process.env.NODE_ENV === 'production'
				? process.env.COOKIE_DOMAIN
				: undefined,
	});

	return data.access;
}
