import { NextResponse, NextRequest } from 'next/server';

import User from '@/models/UserModel';
import dbConnect from '@/lib/dbConnect';
import { createLog } from '@/lib/logger';
import { jwtVerify } from 'jose';

export async function DELETE(request: NextRequest) {
	try {
		const token = request.cookies.get('loginToken')?.value;

		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT
		let verifiedPayload;
		try {
			const { payload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
			verifiedPayload = payload;
			console.log('Token payload completo:', JSON.stringify(payload, null, 2));
			console.log('Datos del usuario:', {
				id: payload.id,
				name: payload.name,
				role: payload.role,
			});
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('userId');

		if (!userId) {
			return NextResponse.json(
				{ error: 'ID de usuario requerido' },
				{ status: 400 }
			);
		}

		await dbConnect();

		// Obtener información del usuario antes de eliminarlo
		const userToDelete = await User.findById(userId);
		if (!userToDelete) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			);
		}

		// Eliminar el usuario
		await User.findByIdAndDelete(userId);

		// Crear el log
		await createLog({
			action: 'DELETE',
			entity: 'USER',
			entityId: userId,
			userId: verifiedPayload.id as string,
			userName: verifiedPayload.name as string,
			userRole: verifiedPayload.role as string,
			details: `Usuario eliminado: ${userToDelete.name} (${userToDelete.email})`,
			ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
		});

		return NextResponse.json({ message: 'Usuario eliminado correctamente' });
	} catch (error) {
		console.error('Error al eliminar usuario:', error);
		return NextResponse.json(
			{ error: 'Error al eliminar el usuario' },
			{ status: 500 }
		);
	}
}
