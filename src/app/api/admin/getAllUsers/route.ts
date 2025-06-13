export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';
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
		const finalQuery = {
			...searchQuery,
		};

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
