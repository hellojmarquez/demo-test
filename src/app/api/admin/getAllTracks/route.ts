export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbconnect from '@/lib/mongodb';
import SingleTrack from '@/models/SingleTrack';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';

export async function GET(req: NextRequest) {
	console.log('get singletracks received');

	try {
		await dbconnect();

		// Aplicar middlewares
		const { page, limit, skip } = paginationMiddleware(req);
		const searchQuery = searchMiddleware(req);
		const sortOptions: SortOptions = {
			newest: { createdAt: -1 as const },
			oldest: { createdAt: 1 as const },
		};
		const sort = sortMiddleware(req, sortOptions);

		// Obtener el total de documentos que coinciden con la búsqueda
		const total = await SingleTrack.countDocuments(searchQuery);

		// Obtener los tracks paginados y filtrados
		const singleTracks = await SingleTrack.find(searchQuery)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean();

		return NextResponse.json({
			success: true,
			data: {
				tracks: singleTracks,
				pagination: {
					total,
					page,
					limit,
					totalPages: Math.ceil(total / limit),
				},
			},
		});
	} catch (error) {
		console.error('Error in getAllTracks:', error);
		return NextResponse.json(
			{ success: false, error: 'Error al obtener los tracks' },
			{ status: 500 }
		);
	}
}
