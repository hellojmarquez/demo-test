import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';
import { createLog } from '@/lib/logger';

export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
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

		await dbConnect();

		// Buscar el release antes de eliminarlo para obtener sus datos
		const release = await Release.findOne({ external_id: params.id });
		if (!release) {
			return NextResponse.json(
				{ success: false, message: 'Release not found' },
				{ status: 404 }
			);
		}

		// Eliminar el release
		const deletedRelease = await Release.findByIdAndUpdate(
			release._id,
			{
				$set: {
					available: false,
				},
			},
			{ new: true }
		);
		if (!deletedRelease) {
			return NextResponse.json(
				{ success: false, message: 'Error al borrar el producto' },
				{ status: 500 }
			);
		}
		try {
			// Crear el log de eliminación
			const logData = {
				action: 'DELETE' as const,
				entity: 'RELEASE' as const,
				entityId: release._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Release eliminado: ${release.name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};
			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}

		return NextResponse.json(
			{ success: true, message: 'Release deleted successfully' },
			{ status: 200 }
		);
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
