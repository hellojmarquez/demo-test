// app/api/admin/updateUser/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	await dbConnect();

	try {
		const body = await req.json();
		console.log(params.id);

		// Si hay una imagen en base64, convertirla a Buffer
		if (body.picture && body.picture.base64) {
			body.picture = Buffer.from(body.picture.base64, 'base64');
		}

		const updatedUser = await User.findByIdAndUpdate(params.id, body, {
			new: true,
			runValidators: true,
		});

		if (!updatedUser) {
			return NextResponse.json(
				{ success: false, message: 'Usuario no encontrado' },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ success: true, user: updatedUser },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error actualizando usuario:', error);
		return NextResponse.json(
			{ success: false, message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
