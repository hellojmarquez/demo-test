import { NextRequest, NextResponse } from 'next/server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
	try {
		// 1. Verificar token de autenticación
		const token = request.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// 2. Verificar JWT
		let verifiedPayload;
		try {
			const { payload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
			verifiedPayload = payload;
		} catch (err) {
			console.error('JWT verification error:', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		// 3. Conectar a la base de datos
		await dbConnect();

		// 4. Parsear el cuerpo de la petición
		let requestBody;
		try {
			requestBody = await request.json();
		} catch (parseError) {
			console.error('JSON parse error:', parseError);
			return NextResponse.json(
				{ success: false, error: 'Invalid JSON data' },
				{ status: 400 }
			);
		}

		const { name, email, password, picture } = requestBody;

		console.log('Request data:', {
			name,
			email,
			password: '***',
			picture: !!picture,
		});

		// 5. Validar campos requeridos
		if (!name || !email || !password) {
			return NextResponse.json(
				{
					success: false,
					message: 'Nombre, email y contraseña son requeridos',
				},
				{ status: 400 }
			);
		}

		// 6. Validar formato de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json(
				{ success: false, message: 'Formato de email inválido' },
				{ status: 400 }
			);
		}

		// 7. Verificar si el email ya existe
		let existingAdmin;
		try {
			existingAdmin = await User.findOne({ email });
		} catch (dbError) {
			console.error('Database query error:', dbError);
			return NextResponse.json(
				{ success: false, error: 'Error al consultar la base de datos' },
				{ status: 500 }
			);
		}

		if (existingAdmin) {
			return NextResponse.json(
				{ success: false, message: 'El email ya está registrado' },
				{ status: 400 }
			);
		}

		// 8. Hashear la contraseña
		let hashedPassword;
		try {
			hashedPassword = await encryptPassword(password);
		} catch (encryptError) {
			console.error('Password encryption error:', encryptError);
			return NextResponse.json(
				{ success: false, error: 'Error al procesar la contraseña' },
				{ status: 500 }
			);
		}

		// 9. Preparar datos del usuario
		const userData = {
			_id: new mongoose.Types.ObjectId(),
			name: name.trim(),
			email: email.toLowerCase().trim(),
			password: hashedPassword,
			picture: picture?.base64 || '',
			role: 'admin',
			status: 'activo',
			permissions: ['admin'],
		};

		// 10. Crear el nuevo administrador
		let newAdmin;
		try {
			newAdmin = await User.create(userData);
		} catch (createError) {
			console.error('User creation error:', createError);

			return NextResponse.json(
				{ success: false, error: 'Error al crear el administrador' },
				{ status: 500 }
			);
		}

		console.log('Admin created successfully:', newAdmin._id);

		// 11. Crear el log (opcional, no debe interrumpir el flujo)
		try {
			const logData = {
				action: 'CREATE' as const,
				entity: 'USER' as const,
				entityId: newAdmin._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Admin creado: ${name}`,
				ipAddress:
					request.headers.get('x-forwarded-for') ||
					request.headers.get('x-real-ip') ||
					'unknown',
			};
			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}

		// 12. Respuesta exitosa
		return NextResponse.json(
			{
				success: true,
				message: 'Administrador creado exitosamente',
				data: {
					id: newAdmin._id,
					name: newAdmin.name,
					email: newAdmin.email,
					role: newAdmin.role,
					status: newAdmin.status,
				},
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Unexpected error in POST /admin:', error);

		return NextResponse.json(
			{
				success: false,
				error: 'Internal Server Error',
				message:
					process.env.NODE_ENV === 'development'
						? error.message
						: 'Ha ocurrido un error interno',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
