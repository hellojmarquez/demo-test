import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SelloLimits from '@/models/SelloLimitsModel';
import User from '@/models/UserModel';

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const body = await request.json();
		const { sello_id, extendedLimit, startDate, endDate, paymentDetails } =
			body;

		// Verificar que el sello existe
		const sello = await User.findOne({ _id: sello_id, role: 'sello' });
		if (!sello) {
			return NextResponse.json(
				{ success: false, message: 'Sello no encontrado' },
				{ status: 404 }
			);
		}

		// Verificar que el límite extendido sea mayor que el límite actual
		if (extendedLimit <= sello.artistLimit) {
			return NextResponse.json(
				{
					success: false,
					message: 'El límite extendido debe ser mayor que el límite actual',
				},
				{ status: 400 }
			);
		}

		// Verificar que no exista un límite extendido activo
		const existingLimit = await SelloLimits.findOne({
			sello_id,
			status: 'activo',
		});

		if (existingLimit) {
			return NextResponse.json(
				{
					success: false,
					message: 'El sello ya tiene un límite extendido activo',
				},
				{ status: 400 }
			);
		}

		// Crear el nuevo límite extendido
		const selloLimit = await SelloLimits.create({
			sello_id,
			originalLimit: sello.artistLimit,
			extendedLimit,
			startDate: startDate || new Date(),
			endDate,
			status: 'activo',
			paymentDetails,
		});

		return NextResponse.json({
			success: true,
			message: 'Límite extendido creado exitosamente',
			data: selloLimit,
		});
	} catch (error: any) {
		console.error('Error creating sello limit:', error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		await dbConnect();

		const { searchParams } = new URL(request.url);
		const sello_id = searchParams.get('sello_id');

		if (!sello_id) {
			return NextResponse.json(
				{ success: false, message: 'Se requiere el ID del sello' },
				{ status: 400 }
			);
		}

		// Verificar que el sello existe
		const sello = await User.findOne({ _id: sello_id, role: 'sello' });
		if (!sello) {
			return NextResponse.json(
				{ success: false, message: 'Sello no encontrado' },
				{ status: 404 }
			);
		}

		// Obtener todos los límites del sello
		const limits = await SelloLimits.find({ sello_id }).sort({ createdAt: -1 });

		return NextResponse.json({
			success: true,
			data: limits,
		});
	} catch (error: any) {
		console.error('Error fetching sello limits:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
