import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
	console.log('create artist request received');
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
		const amazon_music_identifier = formData.get(
			'amazon_music_identifier'
		) as string;
		const apple_identifier = formData.get('apple_identifier') as string;
		const deezer_identifier = formData.get('deezer_identifier') as string;
		const spotify_identifier = formData.get('spotify_identifier') as string;
		const picture = formData.get('picture') as File | null;

		console.log('Extracted fields:', {
			name,
			email,
			hasPassword: !!password,
			hasPicture: !!picture,
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
		});

		// Validar campos requeridos
		if (!name || !email || !password) {
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

		// Crear el nuevo artista
		const newArtist = await User.create({
			name,
			email,
			password,
			picture: pictureBuffer,
			role: 'artista',
			status: 'active',
			permissions: ['artista'],
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
		});

		console.log('Artist created successfully:', {
			id: newArtist._id,
			name: newArtist.name,
			email: newArtist.email,
			role: newArtist.role,
		});

		return NextResponse.json(
			{
				message: 'Artista creado exitosamente',
				artist: {
					id: newArtist._id,
					name: newArtist.name,
					email: newArtist.email,
					role: newArtist.role,
				},
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error creating artist:', error);
		return NextResponse.json(
			{
				error: error.message || 'Internal Server Error',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
