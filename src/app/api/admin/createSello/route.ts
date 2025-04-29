import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
	console.log('create sello request received');
	console.log('Content-Type:', request.headers.get('content-type'));

	try {
		await dbConnect();

		// Verificar si es FormData
		const contentType = request.headers.get('content-type');
		if (!contentType?.includes('multipart/form-data')) {
			return NextResponse.json(
				{ message: 'Se requiere enviar los datos como FormData' },
				{ status: 400 }
			);
		}

		const formData = await request.formData();
		console.log('Received form data fields:', Array.from(formData.keys()));

		// Extraer los campos del FormData
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const primary_genre = formData.get('primary_genre') as string;
		const year = formData.get('year') as string;
		const catalog_num = formData.get('catalog_num') as string;
		const picture = formData.get('picture') as File | null;

		console.log('Extracted fields:', {
			name,
			email,
			hasPassword: !!password,
			hasPicture: !!picture,
			primary_genre,
			year,
			catalog_num,
		});

		// Validar campos requeridos
		if (!name) {
			return NextResponse.json(
				{ message: 'Nombre, email y contraseña son requeridos' },
				{ status: 400 }
			);
		}

		// Verificar si el email ya existe
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return NextResponse.json(
				{ message: 'El email ya está registrado' },
				{ status: 400 }
			);
		}

		// Procesar la imagen si existe
		let pictureBuffer = null;
		if (picture) {
			try {
				const arrayBuffer = await picture.arrayBuffer();
				pictureBuffer = Buffer.from(arrayBuffer);
				console.log('Image converted to buffer successfully');
			} catch (error) {
				console.error('Error converting image to buffer:', error);
				return NextResponse.json(
					{ message: 'Error al procesar la imagen' },
					{ status: 400 }
				);
			}
		}

		// Crear el nuevo sello
		const newSello = await User.create({
			name,
			email,
			password,
			picture: pictureBuffer,
			role: 'sello',
			status: 'active',
			permissions: ['sello'],
			primary_genre,
			year: parseInt(year),
			catalog_num: parseInt(catalog_num),
		});

		console.log('Sello created successfully:', {
			id: newSello._id,
			name: newSello.name,
			email: newSello.email,
			role: newSello.role,
		});

		return NextResponse.json(
			{
				message: 'Sello creado exitosamente',
				sello: {
					id: newSello._id,
					name: newSello.name,
					email: newSello.email,
					role: newSello.role,
				},
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error creating sello:', error);
		return NextResponse.json(
			{
				error: error.message || 'Internal Server Error',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
