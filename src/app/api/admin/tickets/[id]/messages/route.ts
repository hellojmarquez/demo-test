import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/TicketModel';
import { jwtVerify } from 'jose';

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

// GET - Obtener mensajes de un ticket
export async function GET(
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

		await dbConnect();
		const ticket = await Ticket.findById(params.id);

		if (!ticket) {
			return NextResponse.json(
				{ success: false, error: 'Ticket no encontrado' },
				{ status: 404 }
			);
		}

		// Verificar permisos
		const isAdmin = payload.role === 'admin';
		const userId = req.cookies.get('userId')?.value;

		if (!isAdmin && ticket.userId !== userId) {
			return NextResponse.json(
				{ success: false, error: 'No autorizado para ver este ticket' },
				{ status: 403 }
			);
		}

		return NextResponse.json(ticket.messages);
	} catch (error) {
		console.error('Error al obtener mensajes:', error);
		return NextResponse.json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

// POST - Agregar un mensaje a un ticket
export async function POST(
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

		const { content } = await req.json();
		if (!content) {
			return NextResponse.json(
				{ success: false, error: 'El mensaje es requerido' },
				{ status: 400 }
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

		// Verificar permisos
		const isAdmin = payload.role === 'admin';
		const userId = req.cookies.get('userId')?.value;

		if (!isAdmin && ticket.userId !== userId) {
			return NextResponse.json(
				{ success: false, error: 'No autorizado para escribir en este ticket' },
				{ status: 403 }
			);
		}

		// Agregar el mensaje
		const message = {
			content,
			sender: payload.email,
			senderRole: payload.role,
			createdAt: new Date(),
		};

		// Actualizar el ticket con el nuevo mensaje y el campo updatedBy
		ticket.messages.push(message);
		ticket.updatedBy = payload.email;
		ticket.updatedAt = new Date();

		await ticket.save();

		// Emitir evento de nuevo mensaje a través de Socket.IO
		// Esto se manejará en el servidor de Socket.IO

		return NextResponse.json(message);
	} catch (error) {
		console.error('Error al agregar mensaje:', error);
		return NextResponse.json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
