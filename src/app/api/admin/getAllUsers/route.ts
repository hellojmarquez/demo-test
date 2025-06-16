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
	console.log('Buscando subcuentas para:', mainAccountId);

	// Obtener subcuentas directas
	const subcuentas = (await AccountRelationship.find({
		mainAccountId,
		status: 'activo',
	}).populate('subAccountId')) as AccountRelationshipDoc[];

	console.log('Subcuentas encontradas:', subcuentas);

	// Agregar IDs de subcuentas directas
	const subcuentasIds = subcuentas.map(rel => rel.subAccountId._id.toString());
	allSubAccounts.push(...subcuentasIds);

	console.log('IDs acumulados:', allSubAccounts);

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
			console.log('Buscando artistas para sello:', verifiedPayload.id);

			// Buscar asignaciones activas del sello
			const asignaciones = await SelloArtistaContrato.find({
				sello_id: verifiedPayload.id,
				estado: 'activo',
			}).populate('artista_id');

			console.log('Asignaciones encontradas:', asignaciones);

			// Obtener los IDs de los artistas
			const artistasIds = asignaciones.map(asig =>
				asig.artista_id._id.toString()
			);
			console.log('IDs de artistas:', artistasIds);

			// Obtener todas las subcuentas de los artistas
			const todasLasSubcuentas: string[] = [];
			for (const artistaId of artistasIds) {
				const subcuentas = await getAllSubAccounts(artistaId);
				todasLasSubcuentas.push(...subcuentas);
			}
			console.log('Todas las subcuentas encontradas:', todasLasSubcuentas);

			// Combinar IDs de artistas y subcuentas
			const todosLosIds = artistasIds
				.concat(todasLasSubcuentas)
				.filter((id, index, self) => self.indexOf(id) === index);
			console.log('IDs totales (artistas + subcuentas):', todosLosIds);

			// Agregar el filtro de IDs a la consulta
			finalQuery._id = { $in: todosLosIds };
			// Remover external_id si existe en la query
			delete finalQuery.external_id;
			console.log('Query final para sello:', finalQuery);
		}

		// Si el usuario es artista, obtener sus subcuentas
		if (
			verifiedPayload.role === 'artista' ||
			verifiedPayload.role === 'contributor' ||
			verifiedPayload.role === 'publisher'
		) {
			console.log('Buscando subcuentas para artista:', verifiedPayload.id);

			// Obtener todas las subcuentas recursivamente
			const todasLasSubcuentas = await getAllSubAccounts(verifiedPayload.id);
			console.log('Todas las subcuentas encontradas:', todasLasSubcuentas);

			// Agregar el filtro de subcuentas a la consulta
			finalQuery._id = { $in: todasLasSubcuentas };
			// Remover external_id y role si existen en la query
			delete finalQuery.external_id;
			delete finalQuery.role;
			console.log('Query final para artista:', finalQuery);
		}

		// Si el usuario es contributor o publisher, retornar array vacío
		// if (
		// 	verifiedPayload.role === 'contributor' ||
		// 	verifiedPayload.role === 'publisher'
		// ) {
		// 	return NextResponse.json(
		// 		{
		// 			success: false,
		// 			error: 'Acceso denegado',
		// 			message: 'No tienes permiso para ver usuarios',
		// 		},
		// 		{ status: 403 }
		// 	);
		// }

		// Obtener el total de documentos que coinciden con la búsqueda
		const total = await User.countDocuments(finalQuery);

		// Obtener los usuarios con o sin paginación según el parámetro all
		const users = await User.find(finalQuery)
			.sort(sort)
			.skip(getAll ? 0 : skip)
			.limit(getAll ? 0 : limit)
			.select('-password')
			.lean();

		console.log('Usuarios encontrados:', users.length);

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
