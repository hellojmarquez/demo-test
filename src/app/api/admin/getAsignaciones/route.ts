export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SelloArtistaContrato from '@/models/AsignacionModel';
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

		// Obtener todos los contratos activos del sello
		const contratos = await SelloArtistaContrato.find({
			sello_id,
			estado: 'activo',
		}).populate('artista_id', 'name picture');

		return NextResponse.json({
			success: true,
			data: contratos,
		});
	} catch (error) {
		console.error('Error al obtener contratos:', error);
		return NextResponse.json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
