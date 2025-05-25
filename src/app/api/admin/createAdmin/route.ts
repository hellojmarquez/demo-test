import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Admin } from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';

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

		await dbConnect();

		const { name, email, password, picture } = await request.json();
		console.log(name, email, password);
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
		console.log(name, email, password);
		// Hashear la contraseña
		// const hashedPassword = await bcrypt.hash(password, 10);

		// Convertir la imagen base64 a Buffer si existe
		let pictureBuffer = null;
		if (picture?.base64) {
			pictureBuffer = Buffer.from(picture.base64, 'base64');
		}
		const hashedPassword = await encryptPassword(password);
		// Crear el nuevo administrador usando el discriminador Admin
		const newAdmin = await Admin.create({
			name,
			email,
			password: hashedPassword,
			picture: pictureBuffer,
			role: 'admin',
			status: 'activo',
			permissions: ['admin'],
		});
		console.log('newAdmin: ', newAdmin);
		console.log(newAdmin);
		return NextResponse.json(
			{
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
