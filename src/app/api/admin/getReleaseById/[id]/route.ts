export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import Release from '@/models/ReleaseModel';
import mongoose from 'mongoose';

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	console.log('get contributor roles received');

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
	try {
		await dbConnect();
		const releaseId = params.id;

		// Buscar el release por ID
		const release = await Release.findOne({ external_id: releaseId });
		if (!release) {
			return NextResponse.json(
				{ success: false, error: 'Release no encontrado' },
				{ status: 404 }
			);
		}

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
