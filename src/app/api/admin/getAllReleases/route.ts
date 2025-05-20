export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';
import { jwtVerify } from 'jose';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';

export async function GET(req: NextRequest) {
	console.log('get releases roles received');

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

		// Aplicar middleware de paginación
		const { page, limit, skip } = paginationMiddleware(req);

		// Aplicar middleware de búsqueda
		const searchQuery = searchMiddleware(req, 'name');

		// Aplicar middleware de ordenamiento
		const sortOptions: SortOptions = {
			newest: { createdAt: -1 as const },
			oldest: { createdAt: 1 as const },
		};
		const sort = sortMiddleware(req, sortOptions);

		// Obtener el total de documentos que coinciden con la búsqueda
		const total = await Release.countDocuments(searchQuery);

		// Obtener los releases paginados, filtrados y ordenados
		const releases = await Release.find(searchQuery)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean();

		return NextResponse.json(
			{
				success: true,
				data: {
					releases,
					pagination: {
						total,
						page,
						limit,
						totalPages: Math.ceil(total / limit),
					},
				},
			},
			{
				headers: {
					'Cache-Control':
						'no-store, no-cache, must-revalidate, proxy-revalidate',
					Pragma: 'no-cache',
					Expires: '0',
				},
			}
		);
	} catch (error) {
		console.error('Error fetching releases:', error);
		return NextResponse.json(
			{ success: false, error: 'Error fetching releases' },
			{ status: 500 }
		);
	}
}
