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
			socket.on('join-ticket', (ticketId: string) => {
				socket.join(ticketId);
			});

			socket.on('leave-ticket', (ticketId: string) => {
				socket.leave(ticketId);
			});

			socket.on('new-message', ({ ticketId, message }) => {
				io?.to(ticketId).emit('message-received', message);
			});

			socket.on('ticket-updated', ({ ticketId, ticket }) => {});

			socket.on('disconnect', () => {});
		});

		res.socket.server.io = io;
	}
	return io;
};
