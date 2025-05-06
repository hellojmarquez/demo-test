export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	console.log('get all publishers received');

	try {
		await dbConnect();
		const publishers = await User.find({ role: 'publisher' })
			.select('-password')
			.sort({ createdAt: -1 });

		// Convierte los Buffers de MongoDB a base64
		const publisherWithBase64 = publishers.map(publisher => {
			const publisherObj = publisher.toObject();
			return {
				...publisherObj,
				external_id: Number(publisherObj.external_id),
				picture: publisherObj.picture
					? {
							base64: publisherObj.picture.toString('base64'),
					  }
					: null,
			};
		});
		console.log(publisherWithBase64);
		return NextResponse.json({
			success: true,
			data: publisherWithBase64,
		});
	} catch (error) {
		console.error('Error obteniendo publishers:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
