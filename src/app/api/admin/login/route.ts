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
				{ error: 'Se requieren credenciales' },
				{ status: 400 }
			);
		}

		await dbConnect();
		const userDB = await User.findOne({ email: email });

		if (!userDB) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			);
		}

		if (password === userDB.password) {
			try {
				const token = await new SignJWT({
					role: userDB.role || 'admin',
					email: userDB.email,
					id: userDB._id,
				})
					.setProtectedHeader({ alg: 'HS256' })
					.setIssuedAt()
					.setExpirationTime('1h')
					.sign(new TextEncoder().encode(process.env.JWT_SECRET));

				const plainUser = userDB.toObject();
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
				const response = NextResponse.json({
					message: 'Login exitoso',
					user: plainUser,
				});

				const isProd = process.env.NODE_ENV === 'production';
				const cookieDomain = isProd ? process.env.COOKIE_DOMAIN : undefined;
				const sameSite = isProd ? 'none' : 'lax';
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
					name: 'userId',
					value: userDB._id.toString(),
					path: '/',
					maxAge: 2 * 60 * 60,
					httpOnly: true,
					secure: isProd,
					sameSite: sameSite,
					domain: cookieDomain,
				});

				return response;
			} catch (error) {
				console.error('Error al generar el token:', error);
				return NextResponse.json(
					{ error: 'Error al generar el token' },
					{ status: 500 }
				);
			}
		} else {
			return NextResponse.json(
				{ error: 'Contraseña incorrecta' },
				{ status: 401 }
			);
		}
	} catch (error) {
		console.error('Error en la solicitud de login:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
