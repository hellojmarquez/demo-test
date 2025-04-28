import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
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

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json(
				{ success: false, message: 'Invalid ID format' },
				{ status: 400 }
			);
		}

		await dbConnect();

		const deletedSingle = await SingleTrack.findByIdAndDelete(id);

		if (!deletedSingle) {
			return NextResponse.json(
				{ success: false, message: 'Track no encontrado' },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ success: true, message: 'Track eliminado exitosamente' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error eliminado track', error);
		return NextResponse.json(
			{ success: false, message: 'Error eliminado track' },
			{ status: 500 }
		);
	}
}
