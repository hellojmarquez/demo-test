import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { createPrivateKey } from 'crypto';
export async function POST(req: NextRequest) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;

		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT
		let verifiedPayload;
		try {
			const { payload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
			verifiedPayload = payload;
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}
		const { query } = await req.json();
		const privateKeyBase64 = process.env.APPLE_AUTH_KEY_BASE64 || '';

		if (!privateKeyBase64) {
			throw new Error(
				'APPLE_AUTH_KEY_BASE64 no está definida en las variables de entorno'
			);
		}

		// Convertir base64 a string PEM
		const privateKeyString = Buffer.from(privateKeyBase64, 'base64').toString(
			'utf8'
		);

		if (!privateKeyString.includes('-----BEGIN PRIVATE KEY-----')) {
			throw new Error(
				'La clave privada no tiene el formato PEM correcto - falta BEGIN'
			);
		}

		if (!privateKeyString.includes('-----END PRIVATE KEY-----')) {
			throw new Error(
				'La clave privada no tiene el formato PEM correcto - falta END'
			);
		}

		// Convertir la clave a KeyObject
		const privateKey = createPrivateKey({
			key: privateKeyString,
			format: 'pem',
			type: 'pkcs8',
		});

		const jwt = await new SignJWT({
			aud: 'https://api.music.apple.com',
			Issuser: process.env.APPLE_TEAM_ID || 'TU_TEAM_ID',
			iss: process.env.APPLE_TEAM_ID || 'TU_TEAM_ID',
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 20 * 60,
		})
			.setProtectedHeader({
				alg: 'ES256',
				kid: process.env.APPLE_KEY_ID || 'TU_KEY_ID',
			})
			.sign(privateKey);

		// Buscar artistas en Apple Music
		const appleMusicReq = await fetch(
			`https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(
				query
			)}&types=artists&limit=10`,
			{
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			}
		);

		if (!appleMusicReq.ok) {
			console.log('error al solicitar artistas de apple');
			return NextResponse.json({
				success: false,
				error: 'error al solicitar artistas de apple',
			});
		}
		const appleMusicData = await appleMusicReq.json();
		const artists =
			appleMusicData.results?.artists?.data?.map((artist: any) => {
				// Arreglar la URL de la imagen reemplazando placeholders
				let imageUrl = artist.attributes?.artwork?.url;
				if (imageUrl) {
					// Reemplazar {w}x{h} con dimensiones reales
					imageUrl = imageUrl.replace('{w}x{h}', '50x50');
				}

				return {
					value: artist.attributes?.name || artist.name,
					label: artist.attributes?.name || artist.name,
					id: artist.id,
					image: imageUrl,
					url: artist.attributes?.url || artist.url,
					followers: 0,
					popularity: 0,
				};
			}) || [];
		return NextResponse.json({
			success: true,
			data: artists,
			total: artists?.total || 0,
		});
	} catch (err) {
		return NextResponse.json(
			{
				success: false,
				error: 'Error al obtener los artistas de Dezeer',
			},
			{ status: 500 }
		);
	}
}
