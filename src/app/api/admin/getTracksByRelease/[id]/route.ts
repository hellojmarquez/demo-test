export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import SingleTrack from '@/models/SingleTrack';
import Release from '@/models/ReleaseModel';

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const token = req.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		let userRole = '';
		try {
			const { payload: verifiedPayload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
			userRole = verifiedPayload.role as string;
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		await dbConnect();
		const releaseId = params.id;

		if (!releaseId) {
			return NextResponse.json(
				{ success: false, error: 'Release ID no especificado' },
				{ status: 403 }
			);
		}
		const query =
			userRole === 'admin'
				? { external_id: releaseId }
				: { external_id: releaseId, available: true };

		// Obtener el release para obtener su external_id
		const release = await Release.findOne(query);

		if (!release) {
			return NextResponse.json(
				{ success: false, error: 'No se encontró el release' },
				{ status: 200 }
			);
		}
		if (userRole !== 'admin' && !release.available) {
			return NextResponse.json(
				{ success: false, error: 'Release no encontrado' },
				{ status: 403 }
			);
		}
		const tracksuery =
			userRole === 'admin'
				? { release: release.external_id }
				: { release: release.external_id, available: true };

		// Buscar todos los tracks que pertenecen al release usando el external_id
		const tracks = await SingleTrack.find(tracksuery)
			.sort({
				order: 1,
			})
			.lean();

		return NextResponse.json({
			success: true,
			data: tracks || [],
		});
	} catch (error: any) {
		console.error('Error getting tracks by release:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
