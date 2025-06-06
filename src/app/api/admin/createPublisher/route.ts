export const dynamic = 'force-dynamic';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { createLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
	console.log('create publisher received');

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

		const body = await req.json();
		let { name, email, password } = body;

		// Capitalizar la primera letra de cada palabra
		name = name
			.split(' ')
			.map(
				(word: string) =>
					word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			)
			.join(' ');

		// Crear publisher
		const publisherReq = await fetch(
			`${process.env.MOVEMUSIC_API}/publishers`,
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

		const publisherRes = await publisherReq.json();
		if (!publisherRes.id) {
			return NextResponse.json(
				{
					success: false,
					error: publisherRes || 'Error al crear el publisher',
				},
				{ status: 400 }
			);
		}

		// Conectar a la base de datos local
		await dbConnect();
		const hashedPassword = await encryptPassword(password);
		// Crear y guardar el publisher en la base de datos local

		const publisher = new User({
			_id: new mongoose.Types.ObjectId(),
			external_id: publisherRes.id,
			name,
			email,
			password: hashedPassword,
			role: 'publisher',
		});

		await publisher.save();
		try {
			// Crear el log
			const logData = {
				action: 'CREATE' as const,
				entity: 'USER' as const,
				entityId: publisher._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Publisher creado: ${name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error('Error creating publisher:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
