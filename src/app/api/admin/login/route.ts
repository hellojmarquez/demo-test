import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { comparePassword } from '@/utils/auth';
import { createLog } from '@/lib/logger';
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

		// Verificar si el usuario está baneado
		if (userDB.status === 'banneado') {
			const response = NextResponse.json(
				{
					error: 'banneado',
					message: 'Tu cuenta ha sido bloqueada',
				},
				{ status: 403 }
			);

			// Borrar todas las cookies excepto loginToken
			const cookiesToDelete = [
				'accessToken',
				'next-auth.callback-url',
				'next-auth.csrf-token',
				'refreshToken',
				'userId',
			];

			cookiesToDelete.forEach(cookieName => {
				response.cookies.set({
					name: cookieName,
					value: '',
					expires: new Date(0),
					path: '/',
				});
			});

			// Generar token con status banned
			const token = await new SignJWT({
				role: userDB.role,
				email: userDB.email,
				id: userDB._id,
				status: 'banneado',
				name: userDB.name,
			})
				.setProtectedHeader({ alg: 'HS256' })
				.setIssuedAt()
				.setExpirationTime('1h')
				.sign(new TextEncoder().encode(process.env.JWT_SECRET));

			// Establecer el loginToken con el status banned
			response.cookies.set({
				name: 'loginToken',
				value: token,
				path: '/',
				maxAge: 60 * 60 * 24 * 7, // 7 días
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
				domain:
					process.env.NODE_ENV === 'production'
						? process.env.COOKIE_DOMAIN
						: undefined,
			});

			return response;
		}

		const isValidPassword = await comparePassword(password, userDB.password);
		if (isValidPassword) {
			try {
				const externa_id = userDB.external_id ? userDB.external_id : 0;
				const token = await new SignJWT({
					role: userDB.role,
					email: userDB.email,
					id: userDB._id,
					externa_id,
					status: userDB.status,
					name: userDB.name,
				})
					.setProtectedHeader({ alg: 'HS256' })
					.setIssuedAt()
					.setExpirationTime('2d')
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
				try {
					// Crear el log
					const logData = {
						action: 'LOGIN' as const,
						entity: 'USER' as const,
						entityId: userDB._id.toString(),
						userId: userDB._id as string,
						userName: (userDB.name as string) || 'Usuario sin nombre',
						userRole: userDB.role as string,
						details: `Sesión iniciada: ${userDB.name}`,
						ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
					};

					await createLog(logData);
				} catch (logError) {
					console.error('Error al crear el log:', logError);
					// No interrumpimos el flujo si falla el log
				}
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
					maxAge: 60 * 60 * 24 * 7, // 7 días
					httpOnly: true,
					secure: isProd,
					sameSite: sameSite,
					domain: cookieDomain,
				});

				response.cookies.set({
					name: 'loginToken',
					value: token,
					path: '/',
					maxAge: 60 * 60 * 24 * 2, // 2 días
					httpOnly: true,
					secure: isProd,
					sameSite: sameSite,
					domain: cookieDomain,
				});

				response.cookies.set({
					name: 'userId',
					value: userDB._id.toString(),
					path: '/',
					maxAge: 60 * 60 * 24 * 7, // 7 días
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
