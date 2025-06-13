export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { jwtVerify } from 'jose';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';

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

		// Combinar la búsqueda con el filtro de rol
		const query = {
			...searchQuery,
			role: 'sello',
		};

		// Obtener el total de documentos que coinciden con la búsqueda
		const total = await User.countDocuments(query);

		// Obtener los sellos paginados y filtrados
		const sellos = await User.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean();

		return NextResponse.json(
			{
				success: true,
				data: {
					sellos,
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
		console.error('Error fetching sellos:', error);
		return NextResponse.json(
			{ success: false, error: 'Error fetching sellos' },
			{ status: 500 }
		);
	}
}
