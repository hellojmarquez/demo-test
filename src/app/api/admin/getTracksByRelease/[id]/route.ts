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
		const releaseId = params.id;

		if (!releaseId) {
			return NextResponse.json(
				{ success: false, error: 'Release ID no especificado' },
				{ status: 400 }
			);
		}

		// Obtener el release para obtener su external_id
		const release = await Release.findById(releaseId);
		console.log('Release encontrado:', release);

		if (!release) {
			return NextResponse.json(
				{ success: false, error: 'No se encontró el release' },
				{ status: 404 }
			);
		}

		if (!release.external_id) {
			return NextResponse.json(
				{ success: false, error: 'El release no tiene un external_id válido' },
				{ status: 400 }
			);
		}

		console.log('Buscando tracks con external_id:', release.external_id);

		// Buscar todos los tracks que pertenecen al release usando el external_id
		const tracks = await SingleTrack.find({
			release: release.external_id,
		})
			.sort({
				order: 1,
			})
			.lean();

		console.log('Tracks encontrados:', JSON.stringify(tracks, null, 2));

		return NextResponse.json({
			success: true,
			data: tracks,
		});
	} catch (error: any) {
		console.error('Error getting tracks by release:', error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'Internal Server Error',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
