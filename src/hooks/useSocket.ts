import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (ticketId: string) => {
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		// Inicializar Socket.IO con la URL correcta
		if (!socketRef.current) {
			socketRef.current = io(
				process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
				{
					path: '/api/socket',
					addTrailingSlash: false,
					reconnection: true,
					reconnectionAttempts: 5,
					reconnectionDelay: 1000,
				}
			);
		}

		// Unirse a la sala del ticket
		if (ticketId) {
			console.log('Uniéndose al ticket:', ticketId);
			socketRef.current.emit('join-ticket', ticketId);
		}

		// Limpiar al desmontar
		return () => {
			if (socketRef.current && ticketId) {
				console.log('Dejando el ticket:', ticketId);
				socketRef.current.emit('leave-ticket', ticketId);
			}
		};
	}, [ticketId]);

	const sendMessage = (message: any) => {
		if (socketRef.current && ticketId) {
			console.log('Enviando mensaje:', { ticketId, message });
			socketRef.current.emit('new-message', {
				ticketId,
				message,
			});
		}
	};

	const onMessage = (callback: (message: any) => void) => {
		if (socketRef.current) {
			console.log('Configurando listener de mensajes');
			socketRef.current.on('message-received', message => {
				console.log('Mensaje recibido:', message);
				callback(message);
			});
		}
	};

	const updateTicket = (ticket: any) => {
		if (socketRef.current && ticketId) {
			console.log('Emitiendo actualización de ticket:', { ticketId, ticket });
			// Aseguramos que el ticket tenga el ID correcto
			const ticketToEmit = {
				...ticket,
				_id: ticketId,
			};
			socketRef.current.emit('ticket-updated', {
				ticketId,
				ticket: ticketToEmit,
			});
		}
	};

	const onTicketUpdate = (callback: (ticket: any) => void) => {
		if (socketRef.current) {
			console.log('Configurando listener de actualizaciones de ticket');
			socketRef.current.on('ticket-updated', ticket => {
				console.log('Ticket actualizado recibido:', ticket);
				callback(ticket);
			});
		}
	};

	const onTicketsUpdate = (callback: (ticket: any) => void) => {
		if (socketRef.current) {
			console.log(
				'Configurando listener de actualizaciones globales de tickets'
			);
			socketRef.current.on('tickets-updated', ticket => {
				console.log('Actualización global de ticket recibida:', ticket);
				callback(ticket);
			});
		}
	};

	return {
		sendMessage,
		onMessage,
		updateTicket,
		onTicketUpdate,
		onTicketsUpdate,
		socket: socketRef.current,
	};
};
