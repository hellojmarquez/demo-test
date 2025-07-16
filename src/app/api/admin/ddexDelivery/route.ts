export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
	try {
		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;
		const token = request.cookies.get('loginToken')?.value;
		const { searchParams } = new URL(request.url);
		const page = searchParams.get('page') || '1';
		const pageSize = searchParams.get('page_size') || '10';
		const search = searchParams.get('search') || '';
		const ordering = searchParams.get('ordering') || '-created';

		const queryParams = new URLSearchParams({
			page,
			page_size: pageSize,
			ordering,
			...(search && { search }),
		});

		const ddexDeliveryReq = await fetch(
			`${
				process.env.MOVEMUSIC_API
			}/ddex-delivery-confirmations/?${queryParams.toString()}`,
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
			throw new Error('Error al obtener los datos de DDX-Delivery');
		}

		const ddexDeliveryRes = await ddexDeliveryReq.json();
		return NextResponse.json({
			success: true,
			data: ddexDeliveryRes,
		});
	} catch (error: any) {
	
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
