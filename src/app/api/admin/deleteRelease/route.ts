import { NextResponse, NextRequest } from 'next/server';

import Release from '@/models/ReleaseModel';
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
		const releaseId = searchParams.get('releaseId');
		console.log('releaseId', releaseId);

		if (!releaseId) {
			return NextResponse.json(
				{ error: 'ID de release requerido' },
				{ status: 400 }
			);
		}

		await dbConnect();

		// Obtener información del release antes de eliminarlo
		const releaseToDelete = await Release.findById(releaseId);
		if (!releaseToDelete) {
			return NextResponse.json(
				{ error: 'Release no encontrado' },
				{ status: 404 }
			);
		}

		// Eliminar el release
		await Release.findByIdAndDelete(releaseId);
		if (!releaseToDelete) {
			return NextResponse.json(
				{ error: 'Release no se ha podido borrar' },
				{ status: 404 }
			);
		}

		// Crear el log
		await createLog({
			action: 'DELETE',
			entity: 'RELEASE',
			entityId: releaseId,
			userId: verifiedPayload.id as string,
			userName: verifiedPayload.name as string,
			userRole: verifiedPayload.role as string,
			details: `Release eliminado: ${releaseToDelete.name}`,
			ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
		});

		return NextResponse.json({ message: 'Release eliminado correctamente' });
	} catch (error) {
		console.error('Error al eliminar release:');
		return NextResponse.json(
			{ error: 'Error al eliminar el release' },
			{ status: 500 }
		);
	}
}
