// app/api/admin/getAllUsers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';

export async function GET(req: NextRequest) {
	console.log('get users received');

	try {
		await dbConnect();

		// Aplicar middlewares
		const { page, limit, skip } = paginationMiddleware(req);
		const searchQuery = searchMiddleware(req, 'name'); // Buscar por nombre
		const sortOptions: SortOptions = {
			newest: { createdAt: -1 as const },
			oldest: { createdAt: 1 as const },
		};
		const sort = sortMiddleware(req, sortOptions);

		// Obtener el total de documentos que coinciden con la búsqueda
		const total = await User.countDocuments(searchQuery);

		// Obtener los usuarios paginados y filtrados
		const users = await User.find(searchQuery)
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
		console.error('Error in getAllUsers:', error);
		return NextResponse.json(
			{ success: false, error: 'Error al obtener los usuarios' },
			{ status: 500 }
		);
	}
}
