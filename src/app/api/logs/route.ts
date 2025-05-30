import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Log from '@/models/LogModel';
import { validateAdmin } from '@/middleware/validateAdmin';
import { getTokenBack } from '@/utils/tokenBack';
import { verifyToken } from '@/utils/jwt';
import User from '@/models/UserModel';

export async function GET(req: NextRequest) {
	try {
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

		await dbConnect();

		// Obtener parámetros de la URL
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const action = searchParams.get('action');
		const entity = searchParams.get('entity');
		const search = searchParams.get('search');
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

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
	} catch (error) {
		console.error('Error al obtener logs:', error);
		return NextResponse.json(
			{ error: 'Error al obtener los logs' },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		await dbConnect();

		const token = await getTokenBack(req);
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const session = verifyToken(token);
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = session.user;

		const me = await User.findById(user._id, { password: 0 });
		if (!me) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const { message, level = 'info', metadata = {} } = body;

		const newLog = new Log({
			message,
			level,
			metadata,
			user: user._id,
		});

		await newLog.save();

		return NextResponse.json(newLog, { status: 201 });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
}
