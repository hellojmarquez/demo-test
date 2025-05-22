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
		<div className="flex h-screen overflow-hidden">
			{/* Lista de tickets */}
			<div className="w-1/3 border-r flex flex-col">
				<div className="flex justify-between items-center p-4 border-b">
					<h2 className="text-xl font-bold">Tickets</h2>
					<button
						onClick={() => setIsModalOpen(true)}
						className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
					>
						Nuevo Ticket
					</button>
				</div>
				<div className="flex-1 overflow-y-auto">
					{tickets.map(ticket => (
						<div
							key={ticket._id}
							className={`p-4 border-b cursor-pointer ${
								selectedTicket?._id === ticket._id
									? 'bg-blue-100'
									: 'bg-white hover:bg-gray-50'
							}`}
							onClick={() => {
								setSelectedTicket(ticket);
								loadTicketMessages(ticket._id);
							}}
						>
							<h3 className="font-semibold">{ticket.title}</h3>
							<p className="text-sm text-gray-600">{ticket.description}</p>
							<div className="flex justify-between items-center mt-2">
								<span
									className={`px-2 py-1 rounded text-sm ${
										ticket.status === 'open'
											? 'bg-green-100 text-green-800'
											: ticket.status === 'in-progress'
											? 'bg-yellow-100 text-yellow-800'
											: 'bg-red-100 text-red-800'
									}`}
								>
									{ticket.status}
								</span>
								{user?.role === 'admin' && (
									<select
										value={ticket.priority}
										onChange={e =>
											handlePriorityChange(ticket._id, e.target.value)
										}
										className="text-sm border rounded px-2 py-1"
									>
										<option value="low">Baja</option>
										<option value="medium">Media</option>
										<option value="high">Alta</option>
									</select>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Chat del ticket seleccionado */}
			<div className="flex-1 flex flex-col">
				{selectedTicket ? (
					<>
						<div className="flex-1 p-4 overflow-y-auto">
							{/* Mostrar la descripción del ticket como primer mensaje */}
							<div className="mb-4 text-left">
								<div className="inline-block p-3 rounded-lg bg-gray-200">
									<p>{selectedTicket.description}</p>
									<p className="text-xs mt-1">
										{selectedTicket.createdBy} (Creador del ticket)
									</p>
								</div>
							</div>
							{messages.map((message, index) => (
								<div
									key={index}
									className={`mb-4 ${
										message.sender === user?.email ? 'text-right' : 'text-left'
									}`}
								>
									<div
										className={`inline-block p-3 rounded-lg ${
											message.sender === user?.email
												? 'bg-blue-500 text-white'
												: 'bg-gray-200'
										}`}
									>
										<p>{message.content}</p>
										<p className="text-xs mt-1">
											{message.sender} ({message.senderRole})
										</p>
									</div>
								</div>
							))}
						</div>
						<div className="border-t p-4">
							{selectedTicket.status === 'closed' ? (
								<div className="text-center text-gray-500">
									Este ticket está cerrado y no se pueden enviar más mensajes
								</div>
							) : (
								<div className="flex gap-2">
									<input
										type="text"
										value={newMessage}
										onChange={e => setNewMessage(e.target.value)}
										placeholder="Escribe un mensaje..."
										className="flex-1 border rounded px-4 py-2"
										onKeyPress={e => e.key === 'Enter' && handleSendMessage(e)}
									/>
									<button
										onClick={e => handleSendMessage(e)}
										className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
									>
										Enviar
									</button>
									{user?.role === 'admin' && (
										<button
											onClick={handleCloseTicket}
											className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
										>
											Cerrar Ticket
										</button>
									)}
								</div>
							)}
						</div>
					</>
				) : (
					<div className="flex items-center justify-center h-full text-gray-500">
						Selecciona un ticket para ver los mensajes
					</div>
				)}
			</div>

			{/* Modal para crear nuevo ticket */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white p-6 rounded-lg w-full max-w-md">
						<h2 className="text-xl font-bold mb-4">Nuevo Ticket</h2>
						<form onSubmit={handleCreateTicket} className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Título</label>
								<input
									type="text"
									value={newTicket.title}
									onChange={e =>
										setNewTicket({ ...newTicket, title: e.target.value })
									}
									className="w-full border rounded px-3 py-2"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Descripción
								</label>
								<textarea
									value={newTicket.description}
									onChange={e =>
										setNewTicket({ ...newTicket, description: e.target.value })
									}
									className="w-full border rounded px-3 py-2"
									rows={4}
									required
								/>
							</div>
							{user?.role === 'admin' && (
								<div>
									<label className="block text-sm font-medium mb-1">
										Prioridad
									</label>
									<select
										value={newTicket.priority}
										onChange={e =>
											setNewTicket({ ...newTicket, priority: e.target.value })
										}
										className="w-full border rounded px-3 py-2"
									>
										<option value="low">Baja</option>
										<option value="medium">Media</option>
										<option value="high">Alta</option>
									</select>
								</div>
							)}
							<div className="flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-4 py-2 border rounded hover:bg-gray-100"
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
								>
									Crear Ticket
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
