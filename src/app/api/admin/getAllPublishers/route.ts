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

		console.log('Publishers found:', publishers);

		return NextResponse.json({
			success: true,
			data: publishers,
		});
	} catch (error) {
		console.error('Error fetching publishers:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
