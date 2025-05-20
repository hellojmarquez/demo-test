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

let io: SocketIOServer | null = null;

export const initSocket = (res: NextApiResponseWithSocket) => {
	if (!res.socket.server.io) {
		console.log('Inicializando Socket.IO...');
		io = new SocketIOServer(res.socket.server, {
			path: '/api/socket',
			addTrailingSlash: false,
			cors: {
				origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
				methods: ['GET', 'POST'],
				credentials: true,
			},
		});

		io.on('connection', socket => {
			console.log('Cliente conectado:', socket.id);

			socket.on('join-ticket', (ticketId: string) => {
				console.log(`Cliente ${socket.id} se unió al ticket ${ticketId}`);
				socket.join(ticketId);
			});

			socket.on('leave-ticket', (ticketId: string) => {
				console.log(`Cliente ${socket.id} dejó el ticket ${ticketId}`);
				socket.leave(ticketId);
			});

			socket.on('new-message', ({ ticketId, message }) => {
				console.log('Nuevo mensaje recibido:', { ticketId, message });
				io?.to(ticketId).emit('message-received', message);
			});

			socket.on('disconnect', () => {
				console.log('Cliente desconectado:', socket.id);
			});
		});

		res.socket.server.io = io;
	}
	return io;
};
