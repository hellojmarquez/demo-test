export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	console.log('get all artists received');

	try {
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
		console.log(personasWithBase64);
		return NextResponse.json({
			success: true,
			data: personasWithBase64,
		});
	} catch (error) {
		console.error('Error fetching contributor roles:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
