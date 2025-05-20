export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbconnect from '@/lib/mongodb';
import SingleTrack from '@/models/SingleTrack';

export async function GET(req: NextRequest) {
	console.log('get singletracks received');

	try {
		await dbconnect();

		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '5');
		const search = searchParams.get('search') || '';

		const skip = (page - 1) * limit;

		// Construir el query de búsqueda
		const searchQuery = search
			? {
					name: { $regex: search, $options: 'i' }, // búsqueda case-insensitive
			  }
			: {};

		// Obtener el total de documentos que coinciden con la búsqueda
		const total = await SingleTrack.countDocuments(searchQuery);

		// Obtener los tracks paginados y filtrados
		const singleTracks = await SingleTrack.find(searchQuery)
			.sort({ createdAt: -1 })
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
