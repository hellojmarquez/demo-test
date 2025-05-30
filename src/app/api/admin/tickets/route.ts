import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/TicketModel';
import { jwtVerify } from 'jose';

// Función auxiliar para verificar el token y obtener el rol
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

// GET - Obtener todos los tickets
export async function GET(req: NextRequest) {
	try {
		const token = req.cookies.get('loginToken')?.value;

		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'No autorizado' },
				{ status: 401 }
			);
		}

		// Verificar el token y obtener el rol
		const payload = await verifyToken(token);
		if (!payload) {
			return NextResponse.json(
				{ success: false, error: 'Token inválido' },
				{ status: 401 }
			);
		}

		const isAdmin = payload.role === 'admin';

		await dbConnect();

		const userId = req.cookies.get('userId')?.value;

		const tickets = isAdmin
			? await Ticket.find({
					$or: [
						{ assignedTo: userId }, // Tickets asignados al admin actual
						{ assignedTo: { $exists: false } }, // Tickets sin asignar
						{
							$and: [
								{ assignedTo: { $ne: userId } }, // Tickets asignados a otros usuarios
								{ isAdminAssigned: false }, // Que no sean tickets autoasignados por otros admins
							],
						},
					],
			  }).sort({ createdAt: -1 })
			: await Ticket.find({ userId }).sort({ createdAt: -1 });

		return NextResponse.json(tickets);
	} catch (error) {
		console.error('Error detallado al obtener tickets:', error);
		return NextResponse.json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

// POST - Crear un nuevo ticket
export async function POST(req: NextRequest) {
	try {
		const token = req.cookies.get('loginToken')?.value;

		if (!token) {
			console.log('Error: No hay token de autenticación');
			return NextResponse.json(
				{ success: false, error: 'No autorizado' },
				{ status: 401 }
			);
		}

		// Verificar el token
		const payload = await verifyToken(token);
		if (!payload) {
			return NextResponse.json(
				{ success: false, error: 'Token inválido' },
				{ status: 401 }
			);
		}

		const body = await req.json();

		const { title, description, priority, assignedTo } = body;

		if (!title || !description || !assignedTo) {
			console.log('Error: Faltan campos requeridos', {
				title,
				description,
				assignedTo,
			});
			return NextResponse.json(
				{ success: false, error: 'Faltan campos requeridos' },
				{ status: 400 }
			);
		}

		await dbConnect();

		const userId = req.cookies.get('userId')?.value;

		if (!userId) {
			console.log('Error: No hay userId en las cookies');
			return NextResponse.json(
				{ success: false, error: 'Usuario no identificado' },
				{ status: 401 }
			);
		}

		const ticketData = {
			title,
			description,
			priority: priority || 'medium',
			status: 'open',
			userId: assignedTo, // El userId será el mismo que assignedTo
			assignedTo, // Guardamos el ID del usuario asignado
			createdBy: payload.email, // Guardamos el email del creador
		};

		const ticket = await Ticket.create(ticketData);

		return NextResponse.json(ticket);
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

// PUT - Actualizar un ticket
export async function PUT(req: NextRequest) {
	try {
		const token = req.cookies.get('loginToken')?.value;

		if (!token) {
			console.log('Error: No hay token de autenticación');
			return NextResponse.json(
				{ success: false, error: 'No autorizado' },
				{ status: 401 }
			);
		}

		// Verificar el token y obtener el rol
		const payload = await verifyToken(token);
		if (!payload) {
			return NextResponse.json(
				{ success: false, error: 'Token inválido' },
				{ status: 401 }
			);
		}

		const isAdmin = payload.role === 'admin';
		const body = await req.json();
		const { status } = body;
		const ticketId = req.url.split('/').pop();

		if (!ticketId || !status) {
			console.log('Error: Faltan campos requeridos', { ticketId, status });
			return NextResponse.json(
				{ success: false, error: 'Faltan campos requeridos' },
				{ status: 400 }
			);
		}

		await dbConnect();

		const userId = req.cookies.get('userId')?.value;

		if (!userId) {
			console.log('Error: No hay userId en las cookies');
			return NextResponse.json(
				{ success: false, error: 'Usuario no identificado' },
				{ status: 401 }
			);
		}

		const ticket = await Ticket.findById(ticketId);

		if (!ticket) {
			console.log('Error: Ticket no encontrado');
			return NextResponse.json(
				{ success: false, error: 'Ticket no encontrado' },
				{ status: 404 }
			);
		}

		if (!isAdmin && ticket.userId !== userId) {
			console.log('Error: Usuario no autorizado para modificar este ticket');
			return NextResponse.json(
				{ success: false, error: 'No autorizado para modificar este ticket' },
				{ status: 403 }
			);
		}

		const updatedTicket = await Ticket.findByIdAndUpdate(
			ticketId,
			{
				status,
				updatedBy: payload.email, // Guardamos quién actualizó el ticket
				updatedAt: new Date(),
			},
			{ new: true }
		);

		return NextResponse.json(updatedTicket);
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
