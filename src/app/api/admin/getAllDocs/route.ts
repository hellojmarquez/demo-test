import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Contabilidad from '@/models/ContabilidadModel';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
	try {
		const token = req.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT
		try {
			await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
		} catch (err) {
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		await dbConnect();

		// Leer el parámetro id
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');

		if (id) {
			// Buscar y devolver solo ese documento (incluyendo fileContent)
			const doc = await Contabilidad.findById(id);
			if (!doc) {
				return NextResponse.json(
					{ success: false, error: 'No encontrado' },
					{ status: 404 }
				);
			}
			return NextResponse.json({ success: true, doc });
		} else {
			// Traer todos los CSVs (sin fileContent)
			const docs = await Contabilidad.find({ fileName: { $regex: /\.csv$/i } })
				.select('-fileContent')
				.sort({ uploadDate: -1 });
			return NextResponse.json({ success: true, docs });
		}
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
