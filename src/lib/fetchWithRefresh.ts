export async function fetchWithRefresh(
	input: RequestInfo,
	init?: RequestInit
): Promise<Response> {
	let res = await fetch(input, init);

	if (res.status === 401) {
		// Token expirado, intenta refrescarlo
		const refreshRes = await fetch('/api/refresh', { method: 'POST' });

		if (refreshRes.ok) {
			// Reintenta la petición original
			res = await fetch(input, init);
		} else {
			// Falló el refresh, probablemente la sesión expiró completamente
			throw new Error('Session expired');
		}
	}

	return res;
}
