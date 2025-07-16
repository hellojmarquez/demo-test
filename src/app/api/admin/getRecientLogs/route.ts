export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import Log from '@/models/LogModel';
import dbConnect from '@/lib/dbConnect';

export async function GET(request: NextRequest) {
	try {
		// Verificar el token JWT

		const token = request.cookies.get('loginToken')?.value;
		let userRole;

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
		if (verifiedPayload.role !== 'admin') {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}
		const secret = new TextEncoder().encode(process.env.JWT_SECRET);
		const { payload } = await jwtVerify(token, secret);
		if (!payload) {
			return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
		}

		await dbConnect();

		const logs = await Log.find()
			.sort({ createdAt: -1 })
			.limit(5)
			.select(
				'action entity entityId userName userRole details ipAddress createdAt'
			);

		return NextResponse.json({
			success: true,
			logs,
		});
	} catch (error: any) {
		console.error('Error al obtener logs recientes:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
