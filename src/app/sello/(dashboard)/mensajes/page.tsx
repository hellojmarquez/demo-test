'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?:
		| 'default'
		| 'destructive'
		| 'outline'
		| 'secondary'
		| 'ghost'
		| 'link';
	size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = 'default', size = 'default', ...props }, ref) => {
		return (
			<button
				className={cn(
					'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
					{
						'bg-primary text-primary-foreground hover:bg-primary/90':
							variant === 'default',
						'bg-destructive text-destructive-foreground hover:bg-destructive/90':
							variant === 'destructive',
						'border border-input bg-background hover:bg-accent hover:text-accent-foreground':
							variant === 'outline',
						'bg-secondary text-secondary-foreground hover:bg-secondary/80':
							variant === 'secondary',
						'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
						'text-primary underline-offset-4 hover:underline':
							variant === 'link',
						'h-10 px-4 py-2': size === 'default',
						'h-9 rounded-md px-3': size === 'sm',
						'h-11 rounded-md px-8': size === 'lg',
						'h-10 w-10': size === 'icon',
					},
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Button.displayName = 'Button';

interface Message {
	content: string;
	sender: string;
	senderRole: string;
	createdAt: string;
}

interface Ticket {
	_id: string;
	title: string;
	description: string;
	status: string;
	priority: string;
	messages: Message[];
	createdBy: string;
	updatedAt: string;
	updatedBy: string;
}

export default function Mensajes() {
	const { user, loading } = useAuth();
	const router = useRouter();
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
	const [newMessage, setNewMessage] = useState('');
	const [loadingTickets, setLoadingTickets] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [newTicket, setNewTicket] = useState({
		title: '',
		description: '',
		priority: 'medium',
	});
	const [messages, setMessages] = useState<Message[]>([]);

	const { sendMessage, onMessage, onTicketUpdate, updateTicket, socket } =
		useSocket(selectedTicket?._id || '');

	const fetchTickets = async () => {
		try {
			const res = await fetch('/api/admin/tickets');
			if (res.ok) {
				const data = await res.json();
				setTickets(data);
			} else {
				setError('Error al cargar los tickets');
			}
		} catch (err) {
			setError('Error al cargar los tickets');
		} finally {
			setLoadingTickets(false);
		}
	};

	useEffect(() => {
		if (!loading && !user) {
			router.push('/login');
		} else if (user) {
			fetchTickets();
		}
	}, [user, loading, router]);

	useEffect(() => {
		if (!selectedTicket) return;

		console.log(
			'Configurando listeners de socket para ticket:',
			selectedTicket._id
		);

		// Configurar listener de mensajes
		const messageHandler = (message: any) => {
			console.log('Mensaje recibido:', message);
			setMessages(prev => {
				const messageExists = prev.some(
					m =>
						m.content === message.content &&
						m.sender === message.sender &&
						new Date(m.createdAt).getTime() ===
							new Date(message.createdAt).getTime()
				);
				return messageExists ? prev : [...prev, message];
			});
		};

		// Configurar listener de actualizaciones de ticket
		const ticketUpdateHandler = (updatedTicket: any) => {
			console.log('Ticket actualizado recibido en el cliente:', updatedTicket);
			console.log('Ticket seleccionado actual:', selectedTicket);

			// Actualizar el ticket seleccionado
			setSelectedTicket(prev => {
				if (!prev) return null;
				console.log('Actualizando ticket seleccionado:', {
					prev,
					updated: {
						...prev,
						status: updatedTicket.status,
						priority: updatedTicket.priority,
						updatedAt: updatedTicket.updatedAt,
						updatedBy: updatedTicket.updatedBy,
					},
				});
				return {
					...prev,
					status: updatedTicket.status,
					priority: updatedTicket.priority,
					updatedAt: updatedTicket.updatedAt,
					updatedBy: updatedTicket.updatedBy,
				};
			});

			// Actualizar el ticket en la lista
			setTickets(prevTickets => {
				console.log('Actualizando lista de tickets');
				return prevTickets.map(ticket =>
					ticket._id === updatedTicket._id
						? {
								...ticket,
								status: updatedTicket.status,
								priority: updatedTicket.priority,
								updatedAt: updatedTicket.updatedAt,
								updatedBy: updatedTicket.updatedBy,
						  }
						: ticket
				);
			});
		};

		// Registrar los listeners
		console.log('Registrando listeners de socket');
		onMessage(messageHandler);
		onTicketUpdate(ticketUpdateHandler);

		// Limpiar los listeners cuando el componente se desmonte o cambie el ticket
		return () => {
			console.log('Limpiando listeners de socket');
			if (socket) {
				socket.off('message-received', messageHandler);
				socket.off('ticket-updated', ticketUpdateHandler);
			}
		};
	}, [selectedTicket, onMessage, onTicketUpdate, socket]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMessage.trim() || !selectedTicket) return;

		try {
			const response: Response = await fetch(
				`/api/admin/tickets/${selectedTicket._id}/messages`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						content: newMessage,
						sender: user?.email,
					}),
				}
			);

			if (!response.ok) {
				throw new Error('Error al enviar el mensaje');
			}

			const messageData = await response.json();
			console.log('Mensaje enviado:', messageData);

			// No agregamos el mensaje aquí, lo dejamos que llegue por socket
			sendMessage(messageData);
			setNewMessage('');
		} catch (error) {
			console.error('Error al enviar mensaje:', error);
			toast.error('Error al enviar el mensaje');
		}
	};

	const handleCreateTicket = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await fetch('/api/admin/tickets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newTicket),
			});

			if (res.ok) {
				const ticket = await res.json();
				// Verificar si el ticket ya existe antes de agregarlo
				setTickets(prev => {
					const exists = prev.some(t => t._id === ticket._id);
					return exists ? prev : [...prev, ticket];
				});
				setIsModalOpen(false);
				setNewTicket({
					title: '',
					description: '',
					priority: 'medium',
				});
				toast.success('Ticket creado exitosamente');
			} else {
				const error = await res.json();
				toast.error(error.error || 'Error al crear el ticket');
			}
		} catch (err) {
			console.error('Error al crear ticket:', err);
			toast.error('Error al crear el ticket');
		}
	};

	const handlePriorityChange = async (ticketId: string, priority: string) => {
		if (!user?.role || user.role !== 'admin') return;

		try {
			const res = await fetch(`/api/admin/tickets/${ticketId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ priority }),
			});

			if (res.ok) {
				setTickets(prev =>
					prev.map(ticket =>
						ticket._id === ticketId ? { ...ticket, priority } : ticket
					)
				);
			}
		} catch (err) {
			console.error('Error al actualizar prioridad:', err);
		}
	};

	const handleCloseTicket = async () => {
		if (!selectedTicket || !user || user.role !== 'admin') return;

		try {
			console.log('Iniciando cierre de ticket:', selectedTicket._id);
			const response = await fetch(`/api/admin/tickets/${selectedTicket._id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status: 'closed' }),
			});

			if (!response.ok) {
				throw new Error('Error al cerrar el ticket');
			}

			const updatedTicket = await response.json();
			console.log('Respuesta del servidor:', updatedTicket);

			// Primero emitimos la actualización por socket
			console.log('Emitiendo actualización por socket');
			updateTicket({
				...updatedTicket,
				_id: selectedTicket._id,
			});

			// Esperamos un momento para asegurar que el socket emitió el evento
			await new Promise(resolve => setTimeout(resolve, 100));

			// Luego actualizamos el estado local
			console.log('Actualizando estado local');
			setSelectedTicket(prev => {
				if (!prev) return null;
				return {
					...prev,
					status: 'closed',
					updatedAt: updatedTicket.updatedAt,
					updatedBy: updatedTicket.updatedBy,
				};
			});

			setTickets(prevTickets =>
				prevTickets.map(ticket =>
					ticket._id === selectedTicket._id
						? {
								...ticket,
								status: 'closed',
								updatedAt: updatedTicket.updatedAt,
								updatedBy: updatedTicket.updatedBy,
						  }
						: ticket
				)
			);

			toast.success('Ticket cerrado correctamente');
		} catch (error) {
			console.error('Error al cerrar ticket:', error);
			toast.error('Error al cerrar el ticket');
		}
	};

	const handleSelectTicket = async (ticket: Ticket) => {
		setSelectedTicket(ticket);
		await loadTicketMessages(ticket._id);
	};

	// Función para cargar los mensajes de un ticket
	const loadTicketMessages = async (ticketId: string) => {
		try {
			const response = await fetch(`/api/admin/tickets/${ticketId}/messages`);
			if (response.ok) {
				const data = await response.json();
				setMessages(data);
			} else {
				console.error('Error al cargar mensajes');
				setMessages([]);
			}
		} catch (error) {
			console.error('Error al cargar mensajes:', error);
			setMessages([]);
		}
	};

	if (loadingTickets) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				Cargando...
			</div>
		);
	}

	if (error) {
		return <div className="text-red-500">{error}</div>;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-6 sm:px-6 md:px-8">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
						Mensajes
					</h1>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Lista de tickets */}
					<div className="lg:col-span-1 bg-white rounded-lg shadow-sm overflow-hidden">
						<div className="p-4 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">Tickets</h2>
						</div>
						<div className="overflow-y-auto max-h-[calc(100vh-300px)]">
							{tickets.map(ticket => (
								<div
									key={ticket._id}
									onClick={() => handleSelectTicket(ticket)}
									className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
										selectedTicket?._id === ticket._id
											? 'bg-brand-light bg-opacity-10'
											: ''
									}`}
								>
									<div className="flex justify-between items-start">
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">
												{ticket.title}
											</p>
											<p className="text-xs text-gray-500 mt-1 truncate">
												{ticket.description}
											</p>
										</div>
										<div className="ml-4 flex-shrink-0">
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
													ticket.status === 'open'
														? 'bg-green-100 text-green-800'
														: 'bg-gray-100 text-gray-800'
												}`}
											>
												{ticket.status === 'open' ? 'Abierto' : 'Cerrado'}
											</span>
										</div>
									</div>
									<div className="mt-2 flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<span className="text-xs text-gray-500">
												{new Date(ticket.updatedAt).toLocaleDateString()}
											</span>
											<span className="text-xs text-gray-500">•</span>
											<span className="text-xs text-gray-500">
												{ticket.messages.length} mensajes
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Área de mensajes */}
					<div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-[calc(100vh-300px)]">
						{selectedTicket ? (
							<>
								<div className="p-4 border-b border-gray-200 flex justify-between items-center">
									<div>
										<h2 className="text-lg font-semibold text-gray-900">
											{selectedTicket.title}
										</h2>
										<p className="text-sm text-gray-500">
											{selectedTicket.messages.length} mensajes
										</p>
									</div>
									{selectedTicket.status === 'open' && (
										<button
											onClick={handleCloseTicket}
											className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
										>
											Cerrar Ticket
										</button>
									)}
								</div>

								<div className="flex-1 overflow-y-auto p-4 space-y-4">
									{selectedTicket.messages.map((message, index) => (
										<div
											key={index}
											className={`flex ${
												message.sender === 'user'
													? 'justify-end'
													: 'justify-start'
											}`}
										>
											<div
												className={`max-w-[80%] rounded-lg px-4 py-2 ${
													message.sender === 'user'
														? 'bg-brand-light text-white'
														: 'bg-gray-100 text-gray-900'
												}`}
											>
												<p className="text-sm">{message.content}</p>
												<p className="text-xs mt-1 opacity-75">
													{new Date(message.createdAt).toLocaleString()}
												</p>
											</div>
										</div>
									))}
								</div>

								{selectedTicket.status === 'open' && (
									<div className="p-4 border-t border-gray-200">
										<form onSubmit={handleSendMessage} className="flex gap-2">
											<input
												type="text"
												value={newMessage}
												onChange={e => setNewMessage(e.target.value)}
												placeholder="Escribe un mensaje..."
												className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-light focus:outline-none focus:ring-1 focus:ring-brand-light"
											/>
											<button
												type="submit"
												disabled={!newMessage.trim()}
												className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-dark hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Enviar
											</button>
										</form>
									</div>
								)}
							</>
						) : (
							<div className="flex-1 flex items-center justify-center p-4">
								<p className="text-gray-500 text-center">
									Selecciona un ticket para ver los mensajes
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
