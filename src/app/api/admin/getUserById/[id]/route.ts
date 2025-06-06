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
			console.log('no encontrado');
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error('Error al obtener usuario:', error);
		return NextResponse.json(
			{ error: 'Error al obtener usuario' },
			{ status: 500 }
		);
	}
}
