export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {


	try {
		await dbConnect();
		const sellos = await User.find({ role: 'sello' })
			.select('-password')
			.sort({ createdAt: -1 });

		// Convierte los Buffers de MongoDB a base64
		const selloWithBase64 = sellos.map(sello => {
			const selloObj = sello.toObject();
			return {
				...selloObj,
				external_id: Number(selloObj.external_id),
				picture: selloObj.picture
					? {
							base64: selloObj.picture.toString('base64'),
					  }
					: null,
			};
		});

		return NextResponse.json({
			success: true,
			data: selloWithBase64,
		});
	} catch (error) {
		console.error('Error al obtener sellos:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
