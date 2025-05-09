import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Asignacion from '@/models/AsignacionModel';

export async function DELETE(request: NextRequest) {
	try {
		await dbConnect();

		const asignacion_id = request.nextUrl.searchParams.get('asignacion_id');
		if (!asignacion_id) {
			return NextResponse.json(
				{ success: false, message: 'ID de asignación no proporcionado' },
				{ status: 400 }
			);
		}

		// Buscar la asignación
		const asignacion = await Asignacion.findById(asignacion_id);
		if (!asignacion) {
			return NextResponse.json(
				{ success: false, message: 'Asignación no encontrada' },
				{ status: 404 }
			);
		}

		// Actualizar el estado de la asignación a 'terminado'
		asignacion.estado = 'terminado';
		asignacion.fecha_fin = new Date();
		await asignacion.save();

		return NextResponse.json({
			success: true,
			message: 'Asignación terminada exitosamente',
		});
	} catch (error: any) {
		console.error('Error deleting asignacion:', error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}
