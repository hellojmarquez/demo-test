export const dynamic = 'force-dynamic';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { createLog } from '@/lib/logger';
export async function POST(req: NextRequest) {
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

		if (!name || !email) {
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
		if (email) {
			if (
				existingUser &&
				existingUser.email === email &&
				existingUser.role === verifiedPayload.role
			) {
				return NextResponse.json(
					{ error: 'El contributor con este email ya está registrado' },
					{ status: 400 }
				);
			}
		}
		name.trim();
		email.trim();
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

		if (!contributorReq.ok) {
			return NextResponse.json(
				{
					success: false,
					error: contributorRes || 'Error al crear el contributor',
				},
				{ status: 400 }
			);
		}

		// Hashear la contraseña
		const hashedPassword = await encryptPassword(password);

		// Crear y guardar el contribuidor en la base de datos local
		const contributor = new User({
			_id: new mongoose.Types.ObjectId(),
			external_id: contributorRes.id,
			name,
			email,
			password: hashedPassword,
			role: 'contributor',
		});
		const { password: _, ...artistWithoutPassword } = contributor.toObject();
		await contributor.save();

		if (!contributor.external_id) {
			return NextResponse.json(
				{
					success: false,
					error: contributorRes || 'Error al crear el contributor',
				},
				{ status: 401 }
			);
		}
		try {
			// Crear el log
			const logData = {
				action: 'CREATE' as const,
				entity: 'USER' as const,
				entityId: contributor._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `contributor creado: ${name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json(
			{
				success: true,
				contributor: contributor,
			},
			{ status: 201 }
		);
	} catch (error: any) {
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
