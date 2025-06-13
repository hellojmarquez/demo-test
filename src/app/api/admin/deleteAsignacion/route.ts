import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SelloArtistaContrato from '@/models/AsignacionModel';
import { jwtVerify } from 'jose';

export async function DELETE(request: NextRequest) {
	try {
		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;
		const token = request.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT
		try {
			const { payload: verifiedPayload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}
		await dbConnect();

		const contrato_id = request.nextUrl.searchParams.get('asignacion_id');
		if (!contrato_id) {
			return NextResponse.json(
				{ success: false, message: 'ID del contrato no proporcionado' },
				{ status: 400 }
			);
		}

		// Buscar el contrato
		const contrato = await SelloArtistaContrato.findById(contrato_id);
		if (!contrato) {
			return NextResponse.json(
				{ success: false, message: 'Contrato no encontrado' },
				{ status: 404 }
			);
		}

		// Actualizar el estado del contrato a 'terminado'
		contrato.estado = 'terminado';
		contrato.fecha_fin = new Date();
		await contrato.save();

		return NextResponse.json({
			success: true,
			message: 'Contrato terminado exitosamente',
		});
	} catch (error: any) {
		console.error('Error terminando contrato:', error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}
