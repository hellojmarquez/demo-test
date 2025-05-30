import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';

export async function POST(req: NextRequest) {
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

		// Comparación directa de contraseñas (sin encriptación)
		if (password === userDB.password) {
			try {
				// fetch para obtener access token y refresh token para hacer peticiones a move music
				fetch(process.env.MOVEMUSIC_API || '', {
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
				})
					.then(res => res.json())
					.then(r => r);

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

				const response = NextResponse.json({
					message: 'Login exitoso',
					user: plainUser,
				});

				response.cookies.set({
					name: 'admin-log',
					value: token,
					path: '/',
					maxAge: 2 * 60 * 60, // 2 horas
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'strict',
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
