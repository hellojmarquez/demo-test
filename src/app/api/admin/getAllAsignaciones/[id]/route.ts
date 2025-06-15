import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SelloArtistaContrato from '@/models/AsignacionModel';
import { jwtVerify } from 'jose';

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	console.log('get asignations===================');
	console.log('params', params);
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

		// Obtener todos los contratos activos del sello usando el ID de la ruta
		const contratos = await SelloArtistaContrato.find({
			sello_id: params.id,
			estado: 'activo',
		});

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
