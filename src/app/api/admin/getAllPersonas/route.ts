export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import { jwtVerify } from 'jose';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';

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

		// Aplicar middlewares
		const { page, limit, skip } = paginationMiddleware(req);
		const searchQuery = searchMiddleware(req, 'name'); // Buscar por nombre
		const sortOptions: SortOptions = {
			newest: { createdAt: -1 as const },
			oldest: { createdAt: 1 as const },
		};
		const sort = sortMiddleware(req, sortOptions);

		// Combinar la búsqueda con el filtro de roles
		const query = {
			...searchQuery,
			role: { $nin: ['admin', 'sello'] },
		};

		// Obtener el total de documentos que coinciden con la búsqueda
		const total = await User.countDocuments(query);

		// Obtener los usuarios paginados y filtrados
		const users = await User.find(query)
			.select({ password: 0 }) // Excluir el campo password
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean();

		return NextResponse.json({
			success: true,
			data: {
				users,
				pagination: {
					total,
					page,
					limit,
					totalPages: Math.ceil(total / limit),
				},
			},
		});
	} catch (error) {
		console.error('Error fetching users:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
