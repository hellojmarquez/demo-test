export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';
import User from '@/models/UserModel';
import { jwtVerify } from 'jose';
import { paginationMiddleware } from '@/middleware/pagination';
import { searchMiddleware } from '@/middleware/search';
import { sortMiddleware, SortOptions } from '@/middleware/sort';

export async function GET(req: NextRequest) {
	console.log('get releases roles received');

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
		let userRole;
		let userId;
		try {
			const { payload: verifiedPayload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
			userRole = verifiedPayload.role;
			userId = verifiedPayload.id;
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

		// Aplicar middleware de ordenamiento
		const sortOptions: SortOptions = {
			newest: { createdAt: -1 as const },
			oldest: { createdAt: 1 as const },
		};
		const sort = sortMiddleware(req, sortOptions);

		// Construir la query base
		let finalQuery = {};
		if (userRole === 'admin') {
			finalQuery = {
				...searchQuery,
			};
		} else {
			finalQuery = {
				...searchQuery,
				available: true,
			};
		}

		// Filtrar según el rol del usuario
		if (userRole === 'sello') {
			const sello = await User.findById(userId);
			if (!sello) {
				return NextResponse.json(
					{ success: false, error: 'Sello no encontrado' },
					{ status: 404 }
				);
			}
			finalQuery = {
				...searchQuery,
				label: sello.external_id,
			};
		} else if (userRole === 'artista') {
			const artista = await User.findById(userId);
			if (!artista) {
				return NextResponse.json(
					{ success: false, error: 'Artista no encontrado' },
					{ status: 404 }
				);
			}

			finalQuery = {
				...searchQuery,
				artists: {
					$elemMatch: {
						artist: artista.external_id,
					},
				},
			};
		} else if (userRole === 'publisher') {
			const publisher = await User.findById(userId);
			if (!publisher) {
				return NextResponse.json(
					{ success: false, error: 'Publisher no encontrado' },
					{ status: 404 }
				);
			}

			finalQuery = {
				...searchQuery,
				publisher: publisher.external_id,
			};
		} else if (userRole !== 'admin') {
			return NextResponse.json(
				{ success: false, error: 'No autorizado' },
				{ status: 403 }
			);
		}

		// Obtener el total de documentos que coinciden con la búsqueda
		const total = await Release.countDocuments(finalQuery);

		// Obtener los releases paginados, filtrados y ordenados
		const releases = await Release.find(finalQuery)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean();
		await Promise.all(
			releases.map(async release => {
				const releaseGet = await fetch(
					`${process.env.MOVEMUSIC_API}/releases/${release.external_id}`,
					{
						headers: {
							Authorization: `JWT ${moveMusicAccessToken}`,
							'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
							Referer: process.env.MOVEMUSIC_REFERER || '',
						},
					}
				);
				const releaseData = await releaseGet.json();
				if (releaseData && releaseData.status) {
					release.status = releaseData.status;
				}
				if (releaseData && releaseData.qc_feedback) {
					release.qc_feedback = releaseData.qc_feedback;
				}
				if (releaseData && releaseData.acr_alert) {
					release.acr_alert = releaseData.acr_alert;
				}
				if (releaseData && releaseData.has_acr_alert) {
					release.has_acr_alert = releaseData.has_acr_alert;
				}
				if (releaseData && releaseData.ddex_delivery_confirmations) {
					release.has_acr_alert = releaseData.ddex_delivery_confirmations;
				}
			})
		);

		return NextResponse.json(
			{
				success: true,
				data: {
					releases,
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
		console.error('Error fetching releases:', error);
		return NextResponse.json(
			{ success: false, error: 'Error fetching releases' },
			{ status: 500 }
		);
	}
}
