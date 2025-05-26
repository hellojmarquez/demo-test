import { NextResponse, NextRequest } from 'next/server';

import Release from '@/models/ReleaseModel';
import dbConnect from '@/lib/dbConnect';
import { createLog } from '@/lib/logger';
import { jwtVerify } from 'jose';

export async function PUT(request: NextRequest) {
	try {
		const token = request.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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

		if (!releaseId) {
			return NextResponse.json(
				{ error: 'ID de release requerido' },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const { name, label, picture, status } = body;

		await dbConnect();

		// Obtener el release antes de actualizarlo
		const oldRelease = await Release.findById(releaseId);
		if (!oldRelease) {
			return NextResponse.json(
				{ error: 'Release no encontrado' },
				{ status: 404 }
			);
		}

		// Actualizar el release
		const updatedRelease = await Release.findByIdAndUpdate(
			releaseId,
			{ name, label, picture, status },
			{ new: true }
		);

		// Crear el log con los cambios
		const changes = [];
		if (name !== oldRelease.name)
			changes.push(`nombre: ${oldRelease.name} → ${name}`);
		if (status !== oldRelease.status)
			changes.push(`estado: ${oldRelease.status} → ${status}`);
		if (label !== oldRelease.label)
			changes.push(`sello: ${oldRelease.label} → ${label}`);

		await createLog({
			action: 'UPDATE',
			entity: 'RELEASE',
			entityId: releaseId,
			userId: verifiedPayload.id as string,
			userName: verifiedPayload.name as string,
			userRole: verifiedPayload.role as string,
			details: `Release actualizado: ${name} (${changes.join(', ')})`,
			ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
		});

		return NextResponse.json(updatedRelease);
	} catch (error) {
		console.error('Error al actualizar release:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar el release' },
			{ status: 500 }
		);
	}
}
