import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
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

		const deletedSello = await User.findByIdAndDelete(id);

		if (!deletedSello) {
			return NextResponse.json(
				{ success: false, message: 'Sello no encontrado' },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ success: true, message: 'Sello eliminado exitosamente' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error eliminado sello', error);
		return NextResponse.json(
			{ success: false, message: 'Error eliminado sello' },
			{ status: 500 }
		);
	}
}
