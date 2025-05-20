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
		console.log('GET /api/admin/tickets - Iniciando petición');
		const token = req.cookies.get('loginToken')?.value;
		console.log('Token presente:', !!token);

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
		console.log('Es admin:', isAdmin);

		console.log('Conectando a la base de datos...');
		await dbConnect();
		console.log('Conexión a la base de datos exitosa');

		const userId = req.cookies.get('userId')?.value;
		console.log('UserId:', userId);

		console.log('Buscando tickets...');
		const tickets = isAdmin
			? await Ticket.find().sort({ createdAt: -1 })
			: await Ticket.find({ userId }).sort({ createdAt: -1 });
		console.log('Tickets encontrados:', tickets.length);

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
		console.log('POST /api/admin/tickets - Iniciando petición');
		const token = req.cookies.get('loginToken')?.value;
		console.log('Token presente:', !!token);

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

		console.log('Obteniendo datos del body...');
		const body = await req.json();
		console.log('Datos recibidos:', body);
		const { title, description, priority } = body;

		if (!title || !description) {
			console.log('Error: Faltan campos requeridos', { title, description });
			return NextResponse.json(
				{ success: false, error: 'Faltan campos requeridos' },
				{ status: 400 }
			);
		}

		console.log('Conectando a la base de datos...');
		await dbConnect();
		console.log('Conexión a la base de datos exitosa');

		const userId = req.cookies.get('userId')?.value;
		console.log('UserId:', userId);

		if (!userId) {
			console.log('Error: No hay userId en las cookies');
			return NextResponse.json(
				{ success: false, error: 'Usuario no identificado' },
				{ status: 401 }
			);
		}

		console.log('Creando nuevo ticket...');
		const ticketData = {
			title,
			description,
			priority: priority || 'medium',
			status: 'open',
			userId,
			createdBy: payload.email, // Guardamos el email del creador
		};
		console.log('Datos del ticket a crear:', ticketData);

		const ticket = await Ticket.create(ticketData);
		console.log('Ticket creado exitosamente:', ticket);

		return NextResponse.json(ticket);
	} catch (error) {
		console.error('Error detallado al crear ticket:', error);
		if (error instanceof Error) {
			console.error('Mensaje de error:', error.message);
			console.error('Stack trace:', error.stack);
		}
		return NextResponse.json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

// PUT - Actualizar un ticket
export async function PUT(req: NextRequest) {
	try {
		console.log('PUT /api/admin/tickets - Iniciando petición');
		const token = req.cookies.get('loginToken')?.value;
		console.log('Token presente:', !!token);

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
		console.log('Es admin:', isAdmin);

		console.log('Obteniendo datos del body...');
		const body = await req.json();
		console.log('Datos recibidos:', body);
		const { status } = body;
		const ticketId = req.url.split('/').pop();
		console.log('TicketId:', ticketId);

		if (!ticketId || !status) {
			console.log('Error: Faltan campos requeridos', { ticketId, status });
			return NextResponse.json(
				{ success: false, error: 'Faltan campos requeridos' },
				{ status: 400 }
			);
		}

		console.log('Conectando a la base de datos...');
		await dbConnect();
		console.log('Conexión a la base de datos exitosa');

		const userId = req.cookies.get('userId')?.value;
		console.log('UserId:', userId);

		if (!userId) {
			console.log('Error: No hay userId en las cookies');
			return NextResponse.json(
				{ success: false, error: 'Usuario no identificado' },
				{ status: 401 }
			);
		}

		console.log('Buscando ticket...');
		const ticket = await Ticket.findById(ticketId);
		console.log('Ticket encontrado:', ticket);

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

		console.log('Actualizando ticket...');
		const updatedTicket = await Ticket.findByIdAndUpdate(
			ticketId,
			{
				status,
				updatedBy: payload.email, // Guardamos quién actualizó el ticket
				updatedAt: new Date(),
			},
			{ new: true }
		);
		console.log('Ticket actualizado:', updatedTicket);

		return NextResponse.json(updatedTicket);
	} catch (error) {
		console.error('Error detallado al actualizar ticket:', error);
		if (error instanceof Error) {
			console.error('Mensaje de error:', error.message);
			console.error('Stack trace:', error.stack);
		}
		return NextResponse.json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
