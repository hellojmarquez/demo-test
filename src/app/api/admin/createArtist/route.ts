import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
	console.log('create artist request received');

	try {
		await dbConnect();

		const {
			name,
			email,
			password,
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
			picture,
		} = await request.json();

		// Validar campos requeridos
		if (!name) {
			return NextResponse.json(
				{ message: 'Nombre, email y contraseña son requeridos' },
				{ status: 400 }
			);
		}

		// Convertir la imagen base64 a Buffer si existe
		let pictureBuffer = null;
		if (picture?.base64) {
			pictureBuffer = Buffer.from(picture.base64, 'base64');
		}

		// Crear el nuevo artista
		const newArtist = await User.create({
			name,
			email,
			password,
			picture: pictureBuffer,
			role: 'artist',
			status: 'active',
			permissions: ['artist'],
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
		});
		console.log(newArtist);
		return NextResponse.json(
			{
				message: 'Artista creado exitosamente',
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
