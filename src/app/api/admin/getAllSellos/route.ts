import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/utils/fetchMoveMusic';
import dbConnect from '@/lib/dbConnect';
import Sello from '@/models/SelloModel';

export async function GET(req: NextRequest) {
	console.log('get all sellos received');

	try {
		// Connect to the database
		await dbConnect();

		// Fetch all sellos from the database
		const sellos = await Sello.find({});
		console.log(sellos);
		return NextResponse.json(sellos);
	} catch (error) {
		console.error('Error fetching sellos:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch sellos' },
			{ status: 500 }
		);
	}
}
