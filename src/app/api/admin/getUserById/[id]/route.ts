import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import mongoose from 'mongoose';
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await dbConnect();
		const userId = params.id;

		const user = await User.findById(new mongoose.Types.ObjectId(userId));

		if (!user) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: user,
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
