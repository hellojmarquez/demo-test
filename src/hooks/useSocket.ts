import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (ticketId: string) => {
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		// Inicializar Socket.IO con la URL correcta
		socketRef.current = io(
			process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
			{
				path: '/api/socket',
			}
		);

		// Unirse a la sala del ticket
		if (ticketId) {
			socketRef.current.emit('join-ticket', ticketId);
		}

		// Limpiar al desmontar
		return () => {
			if (socketRef.current) {
				if (ticketId) {
					socketRef.current.emit('leave-ticket', ticketId);
				}
				socketRef.current.disconnect();
			}
		};
	}, [ticketId]);

	const sendMessage = (message: any) => {
		if (socketRef.current && ticketId) {
			socketRef.current.emit('new-message', {
				ticketId,
				message,
			});
		}
	};

	const onMessage = (callback: (message: any) => void) => {
		if (socketRef.current) {
			socketRef.current.on('message-received', callback);
		}
	};

	return {
		sendMessage,
		onMessage,
	};
};
