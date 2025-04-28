import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';
import mongoose from 'mongoose';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;

		if (!id) {
			return NextResponse.json(
				{ success: false, message: 'ID is required' },
				{ status: 400 }
			);
		}

		// Validar que el ID sea un ObjectId válido
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json(
				{ success: false, message: 'Invalid ID format' },
				{ status: 400 }
			);
		}

		await dbConnect();

		// Buscar y eliminar el release por ID
		const deletedRelease = await Release.findByIdAndDelete(id);

		if (!deletedRelease) {
			return NextResponse.json(
				{ success: false, message: 'Release not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ success: true, message: 'Release deleted successfully' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error deleting release:', error);
		return NextResponse.json(
			{ success: false, message: 'Error deleting release' },
			{ status: 500 }
		);
	}
}
