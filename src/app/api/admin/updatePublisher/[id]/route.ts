export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { createLog } from '@/lib/logger';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
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
		const { name, email, password, status } = body;

		// Actualizar publisher en la API externa
		const publisherReq = await fetch(
			`${process.env.MOVEMUSIC_API}/publishers/${params.id}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify({ name }),
			}
		);

		const publisherRes = await publisherReq.json();
		console.log('Publisher actualizado en la API externa:', publisherRes);

		// Conectar a la base de datos local
		await dbConnect();

		// Preparar el objeto de actualización
		const updateData: any = {
			name: publisherRes.name,
			external_id: publisherRes.id,
			status,
			...(email && { email }), // Solo incluir email si se proporcionó uno nuevo
		};

		// Si se proporcionó una nueva contraseña, hashearla
		if (password) {
			const hashedPassword = await encryptPassword(password);
			updateData.password = hashedPassword;
		}

		// Actualizar el publisher en la base de datos local
		const updatedPublisher = await User.findOneAndUpdate(
			{ external_id: params.id },
			{ $set: updateData },
			{ new: true }
		);

		if (!updatedPublisher) {
			return NextResponse.json(
				{ success: false, error: 'Publisher not found' },
				{ status: 404 }
			);
		}
		try {
			// Crear el log
			const logData = {
				action: 'UPDATE' as const,
				entity: 'USER' as const,
				entityId: updatedPublisher._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Publisher actualizado: ${name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json({
			success: true,
			publisher: updatedPublisher,
		});
	} catch (error) {
		console.error('Error updating publisher:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
