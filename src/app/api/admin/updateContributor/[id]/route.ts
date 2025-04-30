export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';

export async function PUT(
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

		const body = await req.json();
		const { name } = body;

		// Actualizar contributor en la API externa
		const contributorReq = await fetch(
			`${process.env.MOVEMUSIC_API}/contributors/${params.id}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify({ name }),
			}
		);

		const contributorRes = await contributorReq.json();

		// Conectar a la base de datos local
		await dbConnect();

		// Actualizar el contribuidor en la base de datos local
		const updatedContributor = await User.findOneAndUpdate(
			{ external_id: params.id },
			{
				name: contributorRes.name,
				email: contributorRes.id,
				external_id: contributorRes.id,
				role: 'contributor',
			},
			{ new: true }
		);

		if (!updatedContributor) {
			return NextResponse.json(
				{ success: false, error: 'Contributor not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error('Error updating contributor:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
