import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/UserModel';
import bcrypt from 'bcryptjs';

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
		const { name, email, status, password } = await request.json();

		if (!name || !email || !status) {
			return NextResponse.json(
				{ error: 'Nombre, email y estado son requeridos' },
				{ status: 400 }
			);
		}

		await dbConnect();

		// Validar que el status sea uno de los valores permitidos
		if (!['active', 'inactive', 'banned'].includes(status)) {
			return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
		}

		// Validar formato de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json(
				{ error: 'Formato de email inválido' },
				{ status: 400 }
			);
		}

		// Verificar si el email ya está en uso por otro usuario
		const existingUser = await User.findOne({
			email,
			external_id: { $ne: id },
		});
		if (existingUser) {
			return NextResponse.json(
				{ error: 'El email ya está en uso por otro usuario' },
				{ status: 400 }
			);
		}

		// Preparar los datos de actualización
		const updateData: any = {
			name,
			email,
			status,
			updatedAt: new Date(),
		};

		// Si se proporcionó una nueva contraseña, hashearla y agregarla
		if (password) {
			const hashedPassword = await bcrypt.hash(password, 10);
			updateData.password = hashedPassword;
		}

		// Actualizar el contribuidor usando external_id
		const updatedContributor = await User.findOneAndUpdate(
			{ external_id: id },
			{ $set: updateData },
			{ new: true }
		);

		if (!updatedContributor) {
			return NextResponse.json(
				{ error: 'Contribuidor no encontrado' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: 'Contribuidor actualizado con éxito',
		});
	} catch (error) {
		console.error('Error updating contributor:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar el contribuidor' },
			{ status: 500 }
		);
	}
}
