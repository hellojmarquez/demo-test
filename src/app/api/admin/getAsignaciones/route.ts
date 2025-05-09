export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Asignacion from '@/models/AsignacionModel';
import User from '@/models/UserModel';

export async function GET(req: NextRequest) {
	try {
		await dbConnect();
		const { searchParams } = new URL(req.url);
		const sello_id = searchParams.get('sello_id');

		if (!sello_id) {
			return NextResponse.json(
				{ success: false, error: 'ID del sello no proporcionado' },
				{ status: 400 }
			);
		}

		// Obtener todas las asignaciones activas del sello
		const asignaciones = await Asignacion.find({
			sello_id,
			estado: 'activo',
		}).populate('artista_id', 'name picture');

		return NextResponse.json({
			success: true,
			data: asignaciones,
		});
	} catch (error) {
		console.error('Error al obtener asignaciones:', error);
		return NextResponse.json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
