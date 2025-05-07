export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	console.log('get all artists received');

	try {
		await dbConnect();
		const personas = await User.find({ role: 'publisher' })
			.select('-password')
			.sort({ createdAt: -1 });

		return NextResponse.json({
			success: true,
			data: personas,
		});
	} catch (error) {
		console.error('Error fetching contributor roles:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
