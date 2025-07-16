export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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

		await dbConnect();
		const personas = await User.find({ role: 'artista' })
			.select('-password')
			.sort({ createdAt: -1 });

		// Convierte los Buffers de MongoDB a base64
		const personasWithBase64 = personas.map(persona => {
			const personaObj = persona.toObject();
			return {
				...personaObj,
				external_id: Number(personaObj.external_id),
				picture: personaObj.picture
					? {
							base64: personaObj.picture.toString('base64'),
					  }
					: null,
			};
		});

		return NextResponse.json({
			success: true,
			data: personasWithBase64,
		});
	} catch (error: any) {
		console.error('Error fetching contributor roles:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
