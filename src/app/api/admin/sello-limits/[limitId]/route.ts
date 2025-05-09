import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SelloLimits from '@/models/SelloLimitsModel';
import User from '@/models/UserModel';

export async function PUT(
	request: NextRequest,
	{ params }: { params: { limitId: string } }
) {
	try {
		await dbConnect();

		const { limitId } = params;
		const body = await request.json();
		const { extendedLimit, endDate, status } = body;

		// Verificar que el límite existe
		const existingLimit = await SelloLimits.findById(limitId);
		if (!existingLimit) {
			return NextResponse.json(
				{ success: false, message: 'Límite no encontrado' },
				{ status: 404 }
			);
		}

		// Verificar que el sello existe
		const sello = await User.findOne({
			_id: existingLimit.sello_id,
			role: 'sello',
		});
		if (!sello) {
			return NextResponse.json(
				{ success: false, message: 'Sello no encontrado' },
				{ status: 404 }
			);
		}

		// Si se está actualizando el límite extendido, verificar que sea mayor que el límite original
		if (extendedLimit && extendedLimit <= existingLimit.originalLimit) {
			return NextResponse.json(
				{
					success: false,
					message: 'El límite extendido debe ser mayor que el límite original',
				},
				{ status: 400 }
			);
		}

		// Actualizar el límite
		const updatedLimit = await SelloLimits.findByIdAndUpdate(
			limitId,
			{
				...(extendedLimit && { extendedLimit }),
				...(endDate && { endDate }),
				...(status && { status }),
			},
			{ new: true }
		);

		return NextResponse.json({
			success: true,
			message: 'Límite actualizado exitosamente',
			data: updatedLimit,
		});
	} catch (error: any) {
		console.error('Error updating sello limit:', error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}

export async function GET(
	request: NextRequest,
	{ params }: { params: { limitId: string } }
) {
	try {
		await dbConnect();

		const { limitId } = params;

		// Obtener el límite específico
		const limit = await SelloLimits.findById(limitId);
		if (!limit) {
			return NextResponse.json(
				{ success: false, message: 'Límite no encontrado' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: limit,
		});
	} catch (error: any) {
		console.error('Error fetching sello limit:', error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}
