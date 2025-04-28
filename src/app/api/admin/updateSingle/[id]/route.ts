// app/api/admin/updateRelease/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	await dbConnect();

	try {
		const body = await req.json();

		// Si hay una imagen, convertirla de base64 a Buffer
		if (body.picture && body.picture.base64) {
			body.picture = Buffer.from(body.picture.base64, 'base64');
		}

		const updateSingle = await SingleTrack.findByIdAndUpdate(params.id, body, {
			new: true,
			runValidators: true,
		});

		if (!updateSingle) {
			return NextResponse.json(
				{ success: false, message: 'Release no encontrado' },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{
				success: true,

				message: 'Track actualizado correctamente',
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error actualizando release:', error);
		return NextResponse.json(
			{
				success: false,
				message: 'Error al actualizar el release',
				error: error instanceof Error ? error.message : 'Error desconocido',
			},
			{ status: 500 }
		);
	}
}
