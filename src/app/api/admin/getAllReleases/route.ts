export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
	console.log('get releases roles received');

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
		const releases = await Release.find({}).sort({ createdAt: -1 });
		console.log('releases: ', releases);
		return NextResponse.json(
			{ success: true, data: releases },
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
