export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';
import SelloArtistaContrato from '@/models/AsignacionModel';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
	try {
		// Verificar autenticación
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
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

		// Conectar a la base de datos
		await dbConnect();

		// Verificar si se solicita todos los usuarios
		const searchParams = req.nextUrl.searchParams;
		const getAll = searchParams.get('all') === 'true';

		// Aplicar middleware de paginación solo si no se solicitan todos los usuarios
		const { page, limit, skip } = getAll
			? { page: 1, limit: 0, skip: 0 }
			: paginationMiddleware(req);

		// Aplicar middleware de búsqueda
		// Busca por nombre usando una expresión regular case-insensitive
		const searchQuery = searchMiddleware(req, 'name');

		const sortOptions: SortOptions = {
			newest: { createdAt: -1 as const },
			oldest: { createdAt: 1 as const },
		};
		const sort = sortMiddleware(req, sortOptions);

		// Construir la consulta final combinando búsqueda y filtros adicionales
		const finalQuery: any = {
			...searchQuery,
			// Si el usuario no es admin, no mostrar usuarios admin
			...(verifiedPayload.role !== 'admin' && { role: { $ne: 'admin' } }),
		};

		// Si el usuario es contributor o publisher, devolver error de acceso
		if (
			verifiedPayload.role === 'contributor' ||
			verifiedPayload.role === 'publisher'
		) {
			return NextResponse.json(
				{
					success: true,
					data: {
						users: [],
						pagination: null,
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
		}

		// Si el usuario es sello, obtener solo los artistas asignados
		if (verifiedPayload.role === 'sello') {
			// Obtener las asignaciones activas del sello
			const asignaciones = await SelloArtistaContrato.find({
				sello_id: verifiedPayload.id,
				estado: 'activo',
			});
			console.log('asignaciones', asignaciones);
			// Obtener los IDs de los artistas asignados
			const artistasIds = asignaciones.map(asig => asig.artista_id.external_id);

			// Agregar el filtro de artistas asignados a la consulta
			finalQuery.external_id = { $in: artistasIds };
			finalQuery.role = { $eq: 'artista' };
			console.log('finalQuery', finalQuery);
		}

		// Obtener el total de documentos que coinciden con la búsqueda
		const total = await User.countDocuments(finalQuery);

		// Obtener los usuarios con o sin paginación según el parámetro all
		const users = await User.find(finalQuery)
			.sort(sort)
			.skip(getAll ? 0 : skip)
			.limit(getAll ? 0 : limit)
			.select('-password')
			.lean();

		// Devolver respuesta con datos y metadatos de paginación
		return NextResponse.json(
			{
				success: true,
				data: {
					users,
					pagination: getAll
						? null
						: {
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
		console.error('Error in getAllUsers:', error);
		return NextResponse.json(
			{ success: false, error: 'Error al obtener los usuarios' },
			{ status: 500 }
		);
	}
}
