import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SelloArtistaContrato from '@/models/AsignacionModel';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
	try {
		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;
		const ddexDeliveryReq = await fetch(
			`${process.env.MOVEMUSIC_API}/ddex-delivery-confirmations/`,
			{
				method: 'GET',
				headers: {
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);
		const ddexDeliveryRes = await ddexDeliveryReq.json();
		console.log('ddexDeliveryRes: ', ddexDeliveryRes);
		return NextResponse.json({
			success: true,
			data: ddexDeliveryRes,
		});
	} catch (error: any) {
		console.error('Error terminando contrato:', error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}
