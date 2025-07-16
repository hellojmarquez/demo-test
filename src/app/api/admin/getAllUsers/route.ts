export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';
import SelloArtistaContrato from '@/models/AsignacionModel';
import AccountRelationship from '@/models/AccountRelationshipModel';
import { jwtVerify } from 'jose';

interface SubAccount {
	_id: string;
	name: string;
	email: string;
	role: string;
	status: string;
}

interface AccountRelationshipDoc {
	mainAccountId: string;
	subAccountId: SubAccount;
	role: string;
	status: string;
}

interface VerifiedPayload {
	id: string;
	role: string;
	email: string;
}

// Función recursiva para obtener todas las subcuentas
async function getAllSubAccounts(
	mainAccountId: string,
	allSubAccounts: string[] = []
) {
	// Obtener subcuentas directas
	const subcuentas = (await AccountRelationship.find({
		mainAccountId,
		status: 'activo',
	}).populate('subAccountId')) as AccountRelationshipDoc[];

	// Agregar IDs de subcuentas directas
	const subcuentasIds = subcuentas.map(rel => rel.subAccountId._id.toString());
	allSubAccounts.push(...subcuentasIds);

	// Para cada subcuenta, buscar sus propias subcuentas
	for (const subcuenta of subcuentas) {
		await getAllSubAccounts(
			subcuenta.subAccountId._id.toString(),
			allSubAccounts
		);
	}

	return allSubAccounts;
}

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
		const { payload: verifiedPayload } = (await jwtVerify(
			token,
			new TextEncoder().encode(process.env.JWT_SECRET)
		)) as { payload: VerifiedPayload };

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

		// Si el usuario es sello, obtener artistas asignados y sus subcuentas
		if (verifiedPayload.role === 'sello') {
			// Buscar asignaciones activas del sello
			const asignaciones = await SelloArtistaContrato.find({
				sello_id: verifiedPayload.id,
				estado: 'activo',
			});

			// Obtener los external_ids de los artistas
			const externalIds = asignaciones
				.filter(asig => asig.artista_id && asig.artista_id.external_id)
				.map(asig => asig.artista_id.external_id);

			// Buscar los artistas en la colección User para obtener sus _id
			const artistas = await User.find({
				external_id: { $in: externalIds },
				role: 'artista',
			});

			// Obtener los _id de MongoDB
			const artistasIds = artistas.map(artista => artista._id.toString());

			// Obtener todas las subcuentas de los artistas
			const todasLasSubcuentas: string[] = [];
			for (const artistaId of artistasIds) {
				const subcuentas = await getAllSubAccounts(artistaId);
				todasLasSubcuentas.push(...subcuentas);
			}

			// Combinar IDs de artistas y subcuentas
			const todosLosIds = artistasIds
				.concat(todasLasSubcuentas)
				.filter((id, index, self) => self.indexOf(id) === index);

			// Agregar el filtro de IDs a la consulta
			finalQuery._id = { $in: todosLosIds };
			// Remover external_id si existe en la query
			delete finalQuery.external_id;
		}

		// Si el usuario es artista, obtener sus subcuentas
		if (
			verifiedPayload.role === 'artista' ||
			verifiedPayload.role === 'contributor' ||
			verifiedPayload.role === 'publisher'
		) {
			// Obtener todas las subcuentas recursivamente
			const todasLasSubcuentas = await getAllSubAccounts(verifiedPayload.id);

			// Agregar el filtro de subcuentas a la consulta
			finalQuery._id = { $in: todasLasSubcuentas };
			// Remover external_id y role si existen en la query
			delete finalQuery.external_id;
			delete finalQuery.role;
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
	} catch (error: any) {
		console.error('Error in getAllUsers:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
