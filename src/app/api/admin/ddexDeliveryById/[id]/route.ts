export const dynamic = 'force-dynamic';
import Release from '@/models/ReleaseModel';
import { NextRequest, NextResponse } from 'next/server';

import { jwtVerify } from 'jose';

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;
		const token = request.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT
		let verifiedPayload;
		try {
			const { payload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
			verifiedPayload = payload;
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}
		const releaseId = params.id;
		const ddexDeliveryReq = await fetch(
			`${process.env.MOVEMUSIC_API}/ddex-delivery-confirmations/${releaseId}`,
			{
				method: 'GET',
				headers: {
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);

		if (!ddexDeliveryReq.ok) {
			return NextResponse.json(
				{
					success: false,
					error:
						ddexDeliveryReq.statusText ||
						'Error al obtener los datos de DDX-Delivery',
				},
				{ status: ddexDeliveryReq.status }
			);
		}

		const ddexDeliveryRes = await ddexDeliveryReq.json();
		const release = await Release.findOneAndUpdate(
			{ external_id: releaseId },
			{ $set: { ddex_delivery_confirmations: ddexDeliveryRes } },
			{ new: true }
		);
		await release.save();
		return NextResponse.json({
			success: true,
			data: ddexDeliveryRes,
		});
	} catch (error: any) {
		console.error('Error en DDX-Delivery:', error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}
