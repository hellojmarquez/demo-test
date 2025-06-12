export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import Release from '@/models/ReleaseModel';

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	console.log('get contributor roles received');
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
	try {
		await dbConnect();
		const releaseId = params.id;
		const query =
			userRole === 'admin'
				? { external_id: releaseId }
				: { external_id: releaseId, available: true };
		// Buscar el release por ID
		const release = await Release.findOne(query);
		if (!release) {
			return NextResponse.json(
				{ success: false, error: 'Release no encontrado' },
				{ status: 404 }
			);
		}
		// Si no es admin y el release no está disponible, retornar error
		if (userRole !== 'admin' && !release.available) {
			return NextResponse.json(
				{ success: false, error: 'No tienes permiso para ver este release' },
				{ status: 403 }
			);
		}
		const getRelease = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/${releaseId}`,
			{
				headers: {
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);
		const releaseData = await getRelease.json();

		const updatedRelease = await Release.findOneAndUpdate(
			{ external_id: releaseId },
			{
				$set: {
					status: releaseData.status,
					qc_feedback: releaseData.qc_feedback,
					acr_alert: releaseData.acr_alert,
					has_acr_alert: releaseData.has_acr_alert,
				},
			},
			{ new: true }
		);
		return NextResponse.json({
			success: true,
			data: release,
		});
	} catch (error: any) {
		console.error('Error getting release:', error);
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
