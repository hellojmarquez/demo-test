// app/api/admin/updateRelease/[id]/route.ts
import { NextResponse } from 'next/server';
import Release from '@/models/ReleaseModel';
import dbConnect from '@/lib/mongodb';
import SingleTrack from '@/models/SingleTrack';

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const formData = await request.formData();
		const data = formData.get('data');

		if (!data) {
			return NextResponse.json(
				{ success: false, message: 'No se proporcionaron datos' },
				{ status: 400 }
			);
		}

		const releaseData = JSON.parse(data as string);

		// Convertir los valores a números
		if (releaseData.label) releaseData.label = Number(releaseData.label);
		if (releaseData.publisher)
			releaseData.publisher = Number(releaseData.publisher);
		if (releaseData.genre) releaseData.genre = Number(releaseData.genre);
		if (releaseData.subgenre)
			releaseData.subgenre = Number(releaseData.subgenre);

		await dbConnect();

		// Actualizar el release con los nuevos datos
		const updatedRelease = await Release.findByIdAndUpdate(
			params.id,
			{ $set: releaseData },
			{ new: true, runValidators: true }
		);
		console.log(updatedRelease);
		if (!updatedRelease) {
			return NextResponse.json(
				{ success: false, message: 'No se encontró el release' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: 'Release actualizado exitosamente',
			data: updatedRelease,
		});
	} catch (error: any) {
		console.error('Error al actualizar el release:', error);
		return NextResponse.json(
			{
				success: false,
				message: error.message || 'Error al actualizar el release',
			},
			{ status: 500 }
		);
	}
}
