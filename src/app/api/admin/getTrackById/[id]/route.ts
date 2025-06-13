export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import SingleTrack from '@/models/SingleTrack';
import { Track } from '@/types/track';

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
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
		const externalId = params.id;

		// Buscar el track por external_id
		const query =
			userRole === 'admin'
				? { external_id: externalId }
				: { external_id: externalId, available: true };
		const track = await SingleTrack.findOne(query)
			.select('+genre +subgenre +qc_feedback +available')
			.lean(); // Forzar la inclusión de estos campos

		if (!track) {
			return NextResponse.json(
				{ success: false, error: 'Track no encontrado' },
				{ status: 404 }
			);
		}
		// Type assertion to ensure track has available property
		const typedTrack = track as Track;
		if (userRole !== 'admin' && !typedTrack.available) {
			return NextResponse.json(
				{ success: false, error: 'No tienes permiso para ver este track' },
				{ status: 403 }
			);
		}
		// actualiza los datos con los de la api
		const getTrack = await fetch(
			`${process.env.MOVEMUSIC_API}/tracks/${externalId}`,
			{
				headers: {
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);
		const trackData = await getTrack.json();
		console.log('trackData ', trackData);

		// Actualizar usando updateOne
		const updateResult = await SingleTrack.findOneAndUpdate(
			{ external_id: externalId },
			{
				$set: {
					qc_feedback: trackData.qc_feedback,
					ISRC: trackData.ISRC,
				},
			},
			{
				new: true,
				select: '+qc_feedback +ISRC ', // Forzar la inclusión del campo
			}
		);
	
		return NextResponse.json({
			success: true,
			data: updateResult,
		});
	} catch (error: any) {
		console.error('Error getting track:', error);
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
