import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { comparePassword } from '@/utils/auth';

export async function POST(req: NextRequest) {
	console.log('Login admin request received');
	try {
		const { email, password } = await req.json();
		if (!email || !password) {
			return NextResponse.json(
				{ error: 'credentials are required' },
				{ status: 400 }
			);
		}

		await dbConnect();
		const userDB = await User.findOne({ email: email });

		if (password === userDB.password) {
			// Generamos el JWT local
			const plainUser = userDB.toObject();
			const token = await new SignJWT({ role: plainUser.role })
				.setProtectedHeader({ alg: 'HS256' })
				.setIssuedAt()
				.setExpirationTime('2h')
				.sign(new TextEncoder().encode(process.env.JWT_SECRET));

			delete plainUser.password;

			const moveMusicLoginRes = await fetch(
				`${process.env.MOVEMUSIC_API}/auth/obtain-token/`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
						Referer: process.env.MOVEMUSIC_REFERER || '',
					},
					body: JSON.stringify({
						username: process.env.MOVEMUSIC_USERNAME || '',
						password: process.env.MOVEMUSIC_PASSWORD || '',
					}),
				}
			);

			const moveMusicToken = await moveMusicLoginRes.json();

			// if (!moveMusicToken.access || !moveMusicToken.refresh) {
			// 	return NextResponse.json(
			// 		{ error: 'Could not obtain MoveMusic tokens' },
			// 		{ status: 401 }
			// 	);
			// }

			const response = NextResponse.json({
				message: 'Login successful',
				userDB: plainUser,
			});

			const isProd = process.env.NODE_ENV === 'production';
			const cookieDomain = isProd ? process.env.COOKIE_DOMAIN : undefined;
			const sameSite = isProd ? 'none' : 'lax';

			response.cookies.set({
				name: 'loginToken',
				value: token,
				path: '/',
				maxAge: 2 * 60 * 60,
				httpOnly: true,
				secure: isProd,
				sameSite: 'strict',
				domain: cookieDomain,
			});

			response.cookies.set({
				name: 'accessToken',
				value: moveMusicToken.access,
				path: '/',
				maxAge: 2 * 60 * 60, // 2 horas
				httpOnly: true,
				secure: isProd,
				sameSite: sameSite,
				domain: cookieDomain,
			});

			response.cookies.set({
				name: 'refreshToken',
				value: moveMusicToken.refresh,
				path: '/',
				maxAge: 60 * 60 * 24 * 7,
				httpOnly: true,
				secure: isProd,
				sameSite: sameSite,
				domain: cookieDomain,
			});

			return response;
		} else {
			return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
		}
	} catch (error) {
		console.error('Error in login request:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
