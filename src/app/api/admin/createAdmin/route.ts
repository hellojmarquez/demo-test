import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Admin } from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';
export async function POST(request: NextRequest) {
	console.log('create admin request received');

	try {
		const token = request.cookies.get('loginToken')?.value;
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

		await dbConnect();

		const { name, email, password, picture } = await request.json();

		// Validar campos requeridos
		if (!name || !email || !password) {
			return NextResponse.json(
				{ message: 'Nombre, email y contraseña son requeridos' },
				{ status: 400 }
			);
		}

		// Verificar si el email ya existe
		const existingAdmin = await Admin.findOne({ email });
		if (existingAdmin) {
			return NextResponse.json(
				{ message: 'El email ya está registrado' },
				{ status: 400 }
			);
		}
		console.log('picture', picture);
		// Hashear la contraseña

		const hashedPassword = await encryptPassword(password);
		// Crear el nuevo administrador usando el discriminador Admin
		const newAdmin = await Admin.create({
			name,
			email,
			password: hashedPassword,
			picture: picture ? picture.base64 : '',
			role: 'admin',
			status: 'activo',
			permissions: ['admin'],
		});
		if (!newAdmin) {
			return NextResponse.json(
				{ error: newAdmin || 'Error al crear el administrador' },
				{ status: 400 }
			);
		}
		try {
			// Crear el log
			const logData = {
				action: 'CREATE' as const,
				entity: 'USER' as const,
				entityId: newAdmin._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Admin creado: ${name}`,
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json(
			{
				success: true,
				message: 'Administrador creado exitosamente',
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error creating admin:', error);
		return NextResponse.json(
			{
				error: error.message || 'Internal Server Error',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
