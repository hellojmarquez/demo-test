export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbconnect from '@/lib/mongodb';
import SingleTrack from '@/models/SingleTrack';
import Release from '@/models/ReleaseModel';
import User from '@/models/UserModel';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT y obtener el rol del usuario
		let userRole = '';
		let userId = '';
		try {
			const { payload: verifiedPayload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
			userRole = verifiedPayload.role as string;
			userId = verifiedPayload.id as string;
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		await dbconnect();

		// Aplicar middlewares
		const { page, limit, skip } = paginationMiddleware(req);
		const searchQuery = searchMiddleware(req);
		const sortOptions: SortOptions = {
			newest: { createdAt: -1 as const },
			oldest: { createdAt: 1 as const },
		};
		const sort = sortMiddleware(req, sortOptions);

		let query = { ...searchQuery };
		let total = 0;

		if (userRole === 'sello') {
			// Si es un sello, primero obtenemos sus releases
			const releases = await Release.find({ label: userId }).select('_id');
			const releaseIds = releases.map(release => release._id);

			// Construimos el query para tracks que pertenecen a esos releases
			query = {
				...query,
				release: { $in: releaseIds },
				available: true,
			};

			// Contamos los tracks que coinciden
			total = await SingleTrack.countDocuments(query);
		} else if (userRole === 'publisher') {
			// Si es un publisher, obtenemos su external_id
			const publisher = await User.findById(userId);
			if (!publisher) {
				return NextResponse.json(
					{ success: false, error: 'Publisher no encontrado' },
					{ status: 404 }
				);
			}

			// Construimos el query para tracks donde el publisher participa
			query = {
				...query,
				publishers: {
					$elemMatch: {
						publisher: publisher.external_id,
					},
				},
				available: true,
			};

			// Contamos los tracks que coinciden
			total = await SingleTrack.countDocuments(query);
		} else if (userRole === 'admin') {
			// Para admin, mostramos todos los tracks sin filtro de available
			total = await SingleTrack.countDocuments(query);
		} else {
			// Para otros roles, solo tracks disponibles
			query = {
				...query,
				available: true,
			};
			total = await SingleTrack.countDocuments(query);
		}

		// Obtener los tracks paginados y filtrados
		const singleTracks = await SingleTrack.find(query)
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
