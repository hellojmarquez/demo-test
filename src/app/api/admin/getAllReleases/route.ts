import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';

export async function GET(req: NextRequest) {
	console.log('get releases roles received');

	try {
		await dbConnect();
		const releases = await Release.find().sort({ createdAt: -1 });

		return NextResponse.json({
			success: true,
			data: releases,
		});
	} catch (error) {
		console.error('Error fetching contributor roles:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
