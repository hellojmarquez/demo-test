// app/api/admin/updateUser/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Admin } from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { jwtVerify } from 'jose';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
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
			const { payload: verifiedPayload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}
		const body = await req.json();
		if (!body.name || !body.email) {
			return NextResponse.json(
				{ message: 'Nombre, email y contraseña son requeridos' },
				{ status: 400 }
			);
		}

		// Si hay una imagen en base64, convertirla a Buffer
		if (body.picture && body.picture.startsWith('data:image')) {
			// Remove the data URL prefix if present
			body.picture = body.picture.replace(/^data:image\/\w+;base64,/, '');
		}
		if (body.password && body.password.length > 0) {
			const hashedPassword = await encryptPassword(body.password);
			body.password = hashedPassword;
		}

		await dbConnect();
		const updatedUser = await Admin.findByIdAndUpdate(params.id, body, {
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
