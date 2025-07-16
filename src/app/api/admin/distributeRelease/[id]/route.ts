// app/api/admin/updateRelease/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import Release from '@/models/ReleaseModel';

import { jwtVerify } from 'jose';

interface Track {
	external_id: number;
	title: string;
	mixName: string;
	resource: string;
	_id: string;
}

interface ReleaseDocument {
	_id: string;
	external_id: number;
	tracks: Track[];
	// ... otros campos que necesites
}

export async function POST(
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
		const externalId = params.id;
		const { action } = await req.json();

		const release = await Release.findOne({
			external_id: externalId,
		}).lean();
		if (!release) {
			return NextResponse.json(
				{ success: false, error: 'Release not found' },
				{ status: 404 }
			);
		}

		const distributeReq = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/update-status/`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify({
					id: externalId,
					action: action,
				}),
			}
		);

		const distributeRes = await distributeReq.json();
		if (!distributeRes.ok) {
			return NextResponse.json(
				{
					success: false,
					error: distributeRes || 'ha habido un error al distribuir',
				},
				{ status: 400 }
			);
		}
		const releaseUpdate = await Release.findOneAndUpdate(
			{ external_id: externalId },
			{ $set: { status: 'en revision', qc_feedback: {} } },
			{ new: true }
		).lean();
		if (!releaseUpdate) {
			return NextResponse.json(
				{ success: false, error: 'Release no actualizado' },
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{
				success: true,
				message: distributeRes,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error('Error al distribuir el release:', error);
		return NextResponse.json(
			{
				success: false,
				message: error.message || 'Error al actualizar el release',
			},
			{ status: 500 }
		);
	}
}
