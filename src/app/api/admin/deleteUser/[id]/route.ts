import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/UserModel';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;
		const token = request.cookies.get('loginToken')?.value;
		const { id } = params;
		console.log('Deleting user with ID:', id);

		await connectDB();

		// Verificar si el usuario existe
		const user = await User.findById(id);
		if (!user) {
			return NextResponse.json(
				{ success: false, message: 'Usuario no encontrado' },
				{ status: 404 }
			);
		}

		// Eliminar el usuario
		await User.findByIdAndDelete(id);

		return NextResponse.json(
			{ success: true, message: 'Usuario eliminado correctamente' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error deleting user:', error);
		return NextResponse.json(
			{ success: false, message: 'Error al eliminar el usuario' },
			{ status: 500 }
		);
	}
}
