export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import SingleTrack from '@/models/SingleTrack';

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
		const externalId = params.id;

		// Buscar el track por external_id
		const track = await SingleTrack.findOne({ external_id: externalId })
			.select('+genre +subgenre') // Forzar la inclusión de estos campos
			.lean();

		if (!track) {
			return NextResponse.json(
				{ success: false, error: 'Track no encontrado' },
				{ status: 404 }
			);
		}

		// Transformar los datos antes de enviarlos

		return NextResponse.json({
			success: true,
			data: track,
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
