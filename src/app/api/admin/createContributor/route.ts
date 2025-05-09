export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
	console.log('get contributors received');

	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT
		try {
			const { payload: verifiedPayload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		const body = await req.json();
		let { name, email, password } = body;

		if (!name || !email || !password) {
			return NextResponse.json(
				{ success: false, error: 'Todos los campos son requeridos' },
				{ status: 400 }
			);
		}

		// Capitalizar la primera letra de cada palabra
		name = name
			.split(' ')
			.map(
				(word: string) =>
					word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			)
			.join(' ');

		// Verificar si el email ya existe
		await dbConnect();
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return NextResponse.json(
				{ success: false, error: 'El email ya está registrado' },
				{ status: 400 }
			);
		}

		// Crear contributor en MoveMusic
		const contributorReq = await fetch(
			`${process.env.MOVEMUSIC_API}/contributors`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify({ name: name }),
			}
		);

		const contributorRes = await contributorReq.json();
		console.log(contributorRes);

		// Verificar si la respuesta contiene un error
		if (Array.isArray(contributorRes.name)) {
			return NextResponse.json(
				{
					success: false,
					error:
						contributorRes.name[0] ||
						'Error al crear el contribuidor en MoveMusic',
				},
				{ status: 400 }
			);
		}

		// Hashear la contraseña
		const hashedPassword = await bcrypt.hash(password, 10);

		// Crear y guardar el contribuidor en la base de datos local
		const contributor = new User({
			external_id: contributorRes.id,
			name: contributorRes.name,
			email: email,
			password: hashedPassword,
			role: 'contributor',
		});

		await contributor.save();

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error('Error creating contributor:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
