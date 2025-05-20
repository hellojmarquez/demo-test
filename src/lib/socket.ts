import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export type NextApiResponseWithSocket = NextApiResponse & {
	socket: {
		server: NetServer & {
			io?: SocketIOServer;
		};
	};
};

let io: SocketIOServer;

export const initSocket = () => {
	if (!io) {
		io = new SocketIOServer({
			path: '/api/socket',
			addTrailingSlash: false,
			cors: {
				origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
				methods: ['GET', 'POST'],
			},
		});

		io.on('connection', socket => {
			console.log('Cliente conectado:', socket.id);

			socket.on('join-ticket', (ticketId: string) => {
				socket.join(`ticket-${ticketId}`);
				console.log(`Cliente ${socket.id} se unió a ticket-${ticketId}`);
			});

			socket.on('leave-ticket', (ticketId: string) => {
				socket.leave(`ticket-${ticketId}`);
				console.log(`Cliente ${socket.id} dejó ticket-${ticketId}`);
			});

			socket.on('new-message', (data: { ticketId: string; message: any }) => {
				io.to(`ticket-${data.ticketId}`).emit('message-received', data.message);
			});

			socket.on('disconnect', () => {
				console.log('Cliente desconectado:', socket.id);
			});
		});
	}
	return io;
};
