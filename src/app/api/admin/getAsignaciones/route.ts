export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SelloArtistaContrato from '@/models/AsignacionModel';
import User from '@/models/UserModel';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT y obtener el payload
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
