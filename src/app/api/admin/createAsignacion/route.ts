import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Asignacion from '@/models/AsignacionModel';
import User from '@/models/UserModel';

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const body = await request.json();
		const {
			sello_id,
			artista_id,
			fecha_inicio,
			fecha_fin,
			tipo_contrato,
			porcentaje_distribucion,
		} = body;

		// Verificar que el sello existe
		const sello = await User.findOne({ _id: sello_id, role: 'sello' });
		if (!sello) {
			return NextResponse.json(
				{ success: false, message: 'Sello no encontrado' },
				{ status: 404 }
			);
		}

		// Verificar que el artista existe
		const artista = await User.findOne({ _id: artista_id, role: 'artista' });
		if (!artista) {
			return NextResponse.json(
				{ success: false, message: 'Artista no encontrado' },
				{ status: 404 }
			);
		}

		// Verificar si el artista ya tiene una asignación activa
		const asignacionExistente = await Asignacion.findOne({
			artista_id,
			estado: 'activo',
		});

		if (asignacionExistente) {
			return NextResponse.json(
				{
					success: false,
					message: 'El artista ya tiene una asignación activa',
				},
				{ status: 400 }
			);
		}

		// Verificar el límite de artistas por sello
		const artistasActivos = await Asignacion.countDocuments({
			sello_id,
			estado: 'activo',
		});

		// Verificar si el sello tiene un límite extendido y si no ha expirado
		const currentDate = new Date();
		const hasValidExtendedLimit =
			sello.hasExtendedLimit &&
			sello.limitExpirationDate &&
			sello.limitExpirationDate > currentDate;

		const limiteArtistas = hasValidExtendedLimit ? sello.artistLimit : 3;

		if (artistasActivos >= limiteArtistas) {
			return NextResponse.json(
				{
					success: false,
					message: `El sello ha alcanzado el límite de artistas permitidos (máximo ${limiteArtistas})`,
				},
				{ status: 400 }
			);
		}

		// Crear la asignación
		const asignacion = await Asignacion.create({
			sello_id,
			artista_id,
			fecha_asignacion: fecha_inicio,
			fecha_fin: fecha_fin || null,
			tipo_contrato,
			porcentaje_distribucion,
			estado: 'activo',
		});

		return NextResponse.json({
			success: true,
			message: 'Asignación creada exitosamente',
			data: asignacion,
		});
	} catch (error: any) {
		console.error('Error creating asignacion:', error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}
