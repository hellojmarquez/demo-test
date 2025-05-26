export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export async function POST(req: NextRequest) {
	console.log('INVITAR USUARIOS received');

	try {
		const token = req.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT y obtener el payload
		let verifiedPayload;
		try {
			const { payload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
			verifiedPayload = payload;
			console.log(
				'Payload completo del token:',
				JSON.stringify(payload, null, 2)
			);
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		const body = await req.json();
		const { name, email, password, role } = body;

		// Validar datos requeridos
		if (!name || !email || !password || !role) {
			return NextResponse.json(
				{ success: false, error: 'Faltan datos requeridos' },
				{ status: 400 }
			);
		}

		// Configurar el transporter de Nodemailer con Brevo
		const transporter: Transporter = nodemailer.createTransport({
			host: process.env.BREVO_SMTP_HOST,
			port: Number(process.env.BREVO_SMTP_PORT),
			secure: true,
			auth: {
				user: process.env.BREVO_SMTP_USER,
				pass: process.env.BREVO_SMTP_PASS,
			},
			// Agregar opciones de timeout y retry
			connectionTimeout: 10000, // 10 segundos
			greetingTimeout: 10000,
			socketTimeout: 10000,
			debug: true, // Habilitar logs de debug
			logger: true, // Habilitar logger
			tls: {
				rejectUnauthorized: false, // En caso de problemas con certificados SSL
			},
		} as SMTPTransport.Options);

		// Verificar la conexión antes de enviar
		try {
			await transporter.verify();
			console.log('Conexión SMTP verificada correctamente');
		} catch (error) {
			console.error('Error al verificar la conexión SMTP:', error);
			return NextResponse.json(
				{
					success: false,
					error: 'Error de conexión con el servidor de correo',
				},
				{ status: 500 }
			);
		}

		// Crear el contenido del correo
		const emailContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background-color: #f8f9fa; padding: 20px; text-align: center; }
					.content { padding: 20px; }
					.credentials { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
					.footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h2>¡Bienvenido a nuestra plataforma!</h2>
					</div>
					<div class="content">
						<p>Hola ${name},</p>
						<p>Has sido invitado a unirte a nuestra plataforma como ${role}.</p>
						<p>Aquí están tus credenciales de acceso:</p>
						<div class="credentials">
							<p><strong>Email:</strong> ${email}</p>
							<p><strong>Contraseña:</strong> ${password}</p>
						</div>
						<p>Por favor, inicia sesión y cambia tu contraseña por seguridad.</p>
						<p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
					</div>
					<div class="footer">
						<p>Este es un correo automático, por favor no respondas a este mensaje.</p>
					</div>
				</div>
			</body>
			</html>
		`;

		// Enviar el correo
		const info = await transporter.sendMail({
			from: `"ISLA SOUNDS" <soporte@islasounds.com>`,
			to: email,
			subject: 'Invitación a la plataforma',
			html: emailContent,
		});

		console.log('Email enviado:', info.messageId);

		return NextResponse.json({
			success: true,
			message: 'Usuario invitado y correo enviado exitosamente',
		});
	} catch (error) {
		console.error('Error al invitar usuario:', error);
		return NextResponse.json(
			{ success: false, error: 'Error al procesar la invitación' },
			{ status: 500 }
		);
	}
}
