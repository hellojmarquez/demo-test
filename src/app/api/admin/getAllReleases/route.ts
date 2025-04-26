import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';

export async function GET(req: NextRequest) {
	console.log('get releases roles received');

	try {
		await dbConnect();
		const releases = await Release.find().sort({ createdAt: -1 });
		// Convierte los Buffers a base64
		const releasesWithBase64 = releases.map(release => ({
			...release.toObject(), // para que no devuelva un objeto de Mongoose
			picture: {
				base64: Buffer.from(release.picture).toString('base64'),
			},
		}));
		console.log(releases);
		return NextResponse.json({
			success: true,
			data: releasesWithBase64,
		});
	} catch (error) {
		console.error('Error fetching contributor roles:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
