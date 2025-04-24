import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';

export async function GET(req: NextRequest) {
	console.log('get singletracks received');

	try {
		await dbConnect();

		// Obtener todos los singletracks de la base de datos
		const singleTracks = await SingleTrack.find({}).lean();

		return NextResponse.json({
			success: true,
			singleTracks,
		});
	} catch (error) {
		console.error('Error fetching singletracks:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
