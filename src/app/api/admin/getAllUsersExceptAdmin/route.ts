import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import { jwtVerify } from 'jose';

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

		await dbConnect();

		// Obtener todos los usuarios excepto admins
		const users = await User.find(
			{ role: { $ne: 'admin' } },
			{
				password: 0, // Excluir el campo password
			}
		).sort({ createdAt: -1 }); // Ordenar por fecha de creación, más recientes primero

		return NextResponse.json({
			success: true,
			data: users,
		});
	} catch (error) {
		console.error('Error fetching users:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
