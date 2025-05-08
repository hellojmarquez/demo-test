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

		return NextResponse.json({
			success: true,
			data: sellos,
		});
	} catch (error) {
		console.error('Error al obtener sellos:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
