import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SelloArtistaContrato from '@/models/AsignacionModel';
import User from '@/models/UserModel';
import { jwtVerify } from 'jose';

export async function POST(request: NextRequest) {
	try {
		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;
		const token = request.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}
		try {
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

			const body = await request.json();
			const {
				sello_id,
				artista_id,
				fecha_inicio,
				fecha_fin,
				tipo_contrato,
				porcentaje_distribucion,
			} = body;

			// Convertir las fechas de string a Date
			const fechaInicioDate = new Date(fecha_inicio);
			const fechaFinDate = fecha_fin ? new Date(fecha_fin) : null;

			// Verificar que el sello existe
			const sello = await User.findOne({ _id: sello_id, role: 'sello' });
			if (!sello) {
				return NextResponse.json(
					{ success: false, message: 'Sello no encontrado' },
					{ status: 404 }
				);
			}

			// Verificar que el artista existe
			const artista = await User.findOne({
				external_id: Number(artista_id),
				role: 'artista',
			});
			if (!artista) {
				return NextResponse.json(
					{ success: false, message: 'Artista no encontrado' },
					{ status: 404 }
				);
			}

			// Verificar si el artista ya tiene un contrato activo
			const contratoExistente = await SelloArtistaContrato.findOne({
				'artista_id.external_id': Number(artista_id),
				estado: 'activo',
			});

			if (contratoExistente) {
				return NextResponse.json(
					{
						success: false,
						message: 'El artista ya tiene un contrato activo con otro sello',
					},
					{ status: 400 }
				);
			}

			// Verificar el límite de artistas por sello
			const artistasActivos = await SelloArtistaContrato.countDocuments({
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

			// Crear el contrato con las fechas convertidas
			const contrato = await SelloArtistaContrato.create({
				sello_id,
				artista_id: {
					external_id: Number(artista_id),
					name: artista.name,
				},
				fecha_inicio: fechaInicioDate,
				fecha_fin: fechaFinDate,
				tipo_contrato,
				porcentaje_distribucion,
				estado: 'activo',
			});

			return NextResponse.json({
				success: true,
				message: 'Contrato creado exitosamente',
				data: contrato,
			});
		} catch (error: any) {
			console.error('Error creating contrato:', error);
			return NextResponse.json(
				{ success: false, message: error.message },
				{ status: 500 }
			);
		}
	} catch (error: any) {
		console.error('Error creating contrato:', error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}
