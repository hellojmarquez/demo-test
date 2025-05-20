export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
	console.log('get users received');

	try {
		// Verificar autenticación
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

		// Aplicar middleware de paginación (por defecto: página 1, 10 items por página)
		const { page, limit, skip } = paginationMiddleware(req);

		// Aplicar middleware de búsqueda
		// Busca por nombre usando una expresión regular case-insensitive
		const searchQuery = searchMiddleware(req, 'name');
		console.log('Search query:', searchQuery); // Para debugging

		// Configurar opciones de ordenamiento
		// newest: ordena por fecha de creación descendente (más recientes primero)
		// oldest: ordena por fecha de creación ascendente (más antiguos primero)
		const sortOptions: SortOptions = {
			newest: { createdAt: -1 as const },
			oldest: { createdAt: 1 as const },
		};
		const sort = sortMiddleware(req, sortOptions);
		console.log('Sort options:', sort); // Para debugging

		// Construir la consulta final combinando búsqueda y filtros adicionales
		const finalQuery = {
			...searchQuery,
			// Aquí puedes agregar filtros adicionales si es necesario
			// Por ejemplo, filtrar por rol, estado, etc.
		};

		// Obtener el total de documentos que coinciden con la búsqueda
		const total = await User.countDocuments(finalQuery);
		console.log('Total documents:', total); // Para debugging

		// Obtener los usuarios paginados, filtrados y ordenados
		const users = await User.find(finalQuery)
			.sort(sort) // Aplicar ordenamiento
			.skip(skip)
			.limit(limit)
			.select('-password') // Excluir el campo password por seguridad
			.lean();

		// Devolver respuesta con datos y metadatos de paginación
		return NextResponse.json(
			{
				success: true,
				data: {
					users,
					pagination: {
						total, // Total de documentos
						page, // Página actual
						limit, // Items por página
						totalPages: Math.ceil(total / limit), // Total de páginas
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
