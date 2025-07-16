import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/UserModel';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;

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
	} catch (error: any) {
		console.error('Error deleting user:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
