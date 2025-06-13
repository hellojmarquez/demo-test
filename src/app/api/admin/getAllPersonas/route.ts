export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import SelloArtistaContrato from '@/models/AsignacionModel';
import { jwtVerify } from 'jose';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';

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

		// Verificar JWT y obtener el payload
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

		// Aplicar middlewares
		const { page, limit, skip } = paginationMiddleware(req);
		const searchQuery = searchMiddleware(req, 'name');
		const sortOptions: SortOptions = {
			newest: { createdAt: -1 as const },
			oldest: { createdAt: 1 as const },
		};
		const sort = sortMiddleware(req, sortOptions);

		let query = { ...searchQuery };
		let total;
		let users;

		// Si el usuario es un sello, filtrar por sus artistas asignados
		if (verifiedPayload.role === 'sello') {
			// Obtener los IDs de los artistas asociados al sello
			const contratos = await SelloArtistaContrato.find({
				sello_id: verifiedPayload.id,
				estado: 'activo',
			}).select('artista_id');

			const artistaIds = contratos.map(contrato => contrato.artista_id);

			// Construir la query base
			const baseQuery = {
				role: 'artista' as const,
			};

			// Agregar la búsqueda por nombre si existe
			const finalQuery = {
				...baseQuery,
				...(searchQuery && Object.keys(searchQuery).length > 0
					? searchQuery
					: {}),
				...(artistaIds.length > 0 ? { _id: { $in: artistaIds } } : {}),
			};

			// Obtener el total de documentos que coinciden con la búsqueda
			total = await User.countDocuments(finalQuery);

			// Obtener los usuarios paginados y filtrados
			users = await User.find(finalQuery)
				.select({ password: 0 })
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.lean();
		} else {
			// Para otros roles, mantener la lógica original
			const baseQuery = {};
			const finalQuery = {
				...baseQuery,
				...(searchQuery && Object.keys(searchQuery).length > 0
					? searchQuery
					: {}),
				role: { $nin: ['admin', 'sello'] },
			};

			total = await User.countDocuments(finalQuery);
			users = await User.find(finalQuery)
				.select({ password: 0 })
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.lean();
		}

		const response = {
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
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error('Error fetching users:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
