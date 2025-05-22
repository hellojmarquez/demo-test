import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/TicketModel';
import { jwtVerify } from 'jose';
import User from '@/models/UserModel';

// Función auxiliar para verificar el token
async function verifyToken(token: string) {
	try {
		const secret = new TextEncoder().encode(process.env.JWT_SECRET);
		const { payload } = await jwtVerify(token, secret);
		return payload;
	} catch (error) {
		console.error('Error al verificar token:', error);
		return null;
	}
}

// PUT - Actualizar un ticket específico
export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const token = req.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'No autorizado' },
				{ status: 401 }
			);
		}

		const payload = await verifyToken(token);
		if (!payload) {
			return NextResponse.json(
				{ success: false, error: 'Token inválido' },
				{ status: 401 }
			);
		}

		const isAdmin = payload.role === 'admin';
		const userId = req.cookies.get('userId')?.value;

		if (!userId) {
			return NextResponse.json(
				{ success: false, error: 'Usuario no identificado' },
				{ status: 401 }
			);
		}

		await dbConnect();
		const ticket = await Ticket.findById(params.id);

		if (!ticket) {
			return NextResponse.json(
				{ success: false, error: 'Ticket no encontrado' },
				{ status: 404 }
			);
		}

		if (!isAdmin && ticket.userId !== userId) {
			return NextResponse.json(
				{ success: false, error: 'No autorizado para modificar este ticket' },
				{ status: 403 }
			);
		}

		const body = await req.json();
		const updateData: any = {};

		if (body.status) {
			updateData.status = body.status;
		}
		if (body.priority) {
			updateData.priority = body.priority;
		}
		if (body.assignedTo) {
			// Verificar si el usuario asignado es un admin
			const assignedUser = await User.findById(body.assignedTo);
			if (assignedUser?.role === 'admin') {
				// Si el usuario asignado es un admin, solo ese admin podrá ver el ticket
				updateData.assignedTo = body.assignedTo;
				updateData.userId = body.assignedTo;
				updateData.isAdminAssigned = true;
			} else {
				// Si no es admin, el ticket será visible para todos los admins
				updateData.assignedTo = body.assignedTo;
				updateData.userId = body.assignedTo;
				updateData.isAdminAssigned = false;
			}
		}

		updateData.updatedBy = payload.email;
		updateData.updatedAt = new Date();

		const updatedTicket = await Ticket.findByIdAndUpdate(
			params.id,
			updateData,
			{ new: true }
		);

		return NextResponse.json(updatedTicket);
	} catch (error) {
		console.error('Error al actualizar ticket:', error);
		return NextResponse.json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
