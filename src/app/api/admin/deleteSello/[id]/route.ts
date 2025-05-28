import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
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
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}
		const { id } = params;

		if (!id) {
			return NextResponse.json(
				{ success: false, message: 'ID is required' },
				{ status: 400 }
			);
		}

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json(
				{ success: false, message: 'Invalid ID format' },
				{ status: 400 }
			);
		}

		await dbConnect();

		const deletedSello = await User.findByIdAndDelete(id);

		if (!deletedSello) {
			return NextResponse.json(
				{ success: false, message: 'Sello no encontrado' },
				{ status: 404 }
			);
		}
		try {
			// Crear el log
			const logData = {
				action: 'CREATE' as const,
				entity: 'USER' as const,
				entityId: id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Sello eliminado: ${deletedSello.name}`,
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json(
			{ success: true, message: 'Sello eliminado exitosamente' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error eliminado sello', error);
		return NextResponse.json(
			{ success: false, message: 'Error eliminado sello' },
			{ status: 500 }
		);
	}
}
