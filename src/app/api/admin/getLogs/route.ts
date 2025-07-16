export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import Log from '@/models/LogModel';
import dbConnect from '@/lib/dbConnect';

export async function GET(request: NextRequest) {
	try {
		// Verificar el token JWT
		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;
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
		const secret = new TextEncoder().encode(process.env.JWT_SECRET);
		const { payload } = await jwtVerify(token, secret);
		if (!payload) {
			return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
		}

		// Obtener parámetros de la URL
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const action = searchParams.get('action');
		const entity = searchParams.get('entity');
		const search = searchParams.get('search');
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		await dbConnect();

		// Construir el query
		const query: any = {};

		if (action && action !== 'ALL') {
			query.action = action;
		}

		if (entity && entity !== 'ALL') {
			query.entity = entity;
		}

		if (search) {
			query.$or = [
				{ details: { $regex: search, $options: 'i' } },
				{ userName: { $regex: search, $options: 'i' } },
			];
		}

		if (startDate || endDate) {
			query.createdAt = {};
			if (startDate) {
				query.createdAt.$gte = new Date(startDate);
			}
			if (endDate) {
				query.createdAt.$lte = new Date(endDate);
			}
		}

		// Calcular el total de documentos
		const total = await Log.countDocuments(query);

		// Obtener los logs con paginación

		const logs = await Log.find(query)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean();

		return NextResponse.json({
			logs,
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error: any) {
		console.error('Error al obtener logs:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
