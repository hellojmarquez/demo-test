'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import SortSelect from '@/components/SortSelect';
import SearchInput from '@/components/SearchInput';
import FilterSelect from '@/components/FilterSelect';
import Select from 'react-select';

import {
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../../components/ui/select';

import { cn } from '@/lib/utils';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { Plus } from 'lucide-react';

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
	userId: string;
	assignedTo: string;
	createdAt: string;
	updatedAt: string;
}

interface User {
	_id: string;
	name: string;
	email: string;
	role: string;
}

export default function Mensajes() {
	const { user, loading } = useAuth();
	const router = useRouter();
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
	const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
	const [newMessage, setNewMessage] = useState('');
	const [loadingTickets, setLoadingTickets] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
	const [searchQuery, setSearchQuery] = useState('');
	const [priorityFilter, setPriorityFilter] = useState('all');
	const [newTicket, setNewTicket] = useState({
		title: '',
		description: '',
		priority: 'medium',
		assignedTo: '',
	});
	const [messages, setMessages] = useState<Message[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);

	const { sendMessage, onMessage, onTicketUpdate, updateTicket, socket } =
		useSocket(selectedTicket?._id || '');

	const fetchTickets = async () => {
		try {
			const res = await fetch('/api/admin/tickets');
			if (res.ok) {
				const data = await res.json();
				setTickets(data);

				// Filtrar tickets según el rol del usuario
				if (user?.role === 'admin') {
					// Los administradores ven todos los tickets excepto los que otros admins se han autoasignado
					const adminTickets = data.filter((ticket: Ticket) => {
						// Si el ticket está asignado a un admin
						const assignedUser = users.find(u => u._id === ticket.assignedTo);
						if (assignedUser?.role === 'admin') {
							// Solo mostrar si el admin asignado es el usuario actual
							return ticket.assignedTo === user._id;
						}
						// Mostrar todos los demás tickets
						return true;
					});
					setFilteredTickets(adminTickets);
				} else {
					// Los usuarios normales solo ven los tickets asignados a ellos
					const userTickets = data.filter(
						(ticket: Ticket) =>
							// Verificar si el ticket está asignado al usuario actual
							ticket.userId === user?._id ||
							ticket.assignedTo === user?._id ||
							// O si el usuario lo creó
							ticket.createdBy === user?.email
					);
					setFilteredTickets(userTickets);
				}
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
	}, [user, loading, router, users]);

	// Efecto para filtrar tickets cuando cambia la búsqueda o el filtro de prioridad
	useEffect(() => {
		const filtered = tickets.filter(ticket => {
			const searchLower = searchQuery.toLowerCase();
			const matchesSearch =
				ticket.title.toLowerCase().includes(searchLower) ||
				ticket.description.toLowerCase().includes(searchLower) ||
				ticket.status.toLowerCase().includes(searchLower) ||
				ticket.priority.toLowerCase().includes(searchLower);

			const matchesPriority =
				priorityFilter === 'all' || ticket.priority === priorityFilter;

			return matchesSearch && matchesPriority;
		});

		// Ordenar los tickets filtrados
		const sortedTickets = [...filtered].sort((a, b) => {
			const dateA = new Date(a.createdAt).getTime();
			const dateB = new Date(b.createdAt).getTime();
			return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
		});

		setFilteredTickets(sortedTickets);
	}, [searchQuery, priorityFilter, tickets, sortOrder]);

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

	useEffect(() => {
		const fetchUsers = async () => {
			if (user?.role === 'admin') {
				setLoadingUsers(true);
				try {
					const res = await fetch(
						'/api/admin/getAllUsers?includeAdmins=true&includeCurrentUser=true'
					);
					const data = await res.json();
					if (data.success) {
						// Asegurarnos de que el usuario actual esté incluido
						const allUsers = data.data.users;
						const currentUserExists = allUsers.some(
							(u: User) => u._id === user._id
						);

						if (!currentUserExists && user) {
							setUsers([
								...allUsers,
								{
									_id: user._id,
									name: user.name,
									email: user.email,
									role: user.role,
								},
							]);
						} else {
							setUsers(allUsers);
						}
					}
				} catch (error) {
					console.error('Error fetching users:', error);
				} finally {
					setLoadingUsers(false);
				}
			}
		};
		fetchUsers();
	}, [user]);

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
						notifyAssignedUser: true,
					}),
				}
			);

			if (!response.ok) {
				throw new Error('Error al enviar el mensaje');
			}

			const messageData = await response.json();
			console.log('Mensaje enviado:', messageData);

			sendMessage(messageData);
			setNewMessage('');
		} catch (error) {
			console.error('Error al enviar mensaje:', error);
			toast.error('Error al enviar el mensaje');
		}
	};

	const handleCreateTicket = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTicket.assignedTo) {
			toast.error('Debes seleccionar un usuario para asignar el ticket');
			return;
		}

		try {
			// Encontrar el usuario asignado
			const assignedUser = users.find(u => u._id === newTicket.assignedTo);
			if (!assignedUser) {
				toast.error('Usuario asignado no encontrado');
				return;
			}

			const ticketData = {
				title: newTicket.title,
				description: newTicket.description,
				priority: newTicket.priority,
				status: 'open',
				createdBy: user?.email,
				userId: assignedUser._id,
				assignedTo: assignedUser._id,
			};

			console.log('Enviando datos del ticket:', ticketData);

			const res = await fetch('/api/admin/tickets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(ticketData),
			});

			if (res.ok) {
				const ticket = await res.json();
				console.log('Ticket creado:', ticket);
				setTickets(prev => {
					const exists = prev.some(t => t._id === ticket._id);
					return exists ? prev : [...prev, ticket];
				});
				setIsModalOpen(false);
				setNewTicket({
					title: '',
					description: '',
					priority: 'medium',
					assignedTo: '',
				});
				toast.success(`Ticket creado y asignado a ${assignedUser.name}`);
			} else {
				const error = await res.json();
				console.error('Error al crear ticket:', error);
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

	const handleAssignTicket = async (ticketId: string, userId: string) => {
		if (!user?.role || user.role !== 'admin') return;

		try {
			// Encontrar el usuario asignado
			const assignedUser = users.find(u => u._id === userId);
			if (!assignedUser) {
				toast.error('Usuario no encontrado');
				return;
			}

			const updateData = {
				userId: assignedUser._id,
				assignedTo: assignedUser._id,
				notifyUser: true,
				assignedBy: user.email,
			};

			console.log('Actualizando ticket con datos:', updateData);

			const res = await fetch(`/api/admin/tickets/${ticketId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			});

			if (res.ok) {
				const updatedTicket = await res.json();
				console.log('Ticket actualizado:', updatedTicket);
				setTickets(prev =>
					prev.map(ticket =>
						ticket._id === ticketId
							? {
									...ticket,
									userId: assignedUser._id,
									assignedTo: assignedUser._id,
							  }
							: ticket
					)
				);
				if (selectedTicket?._id === ticketId) {
					setSelectedTicket(prev =>
						prev
							? {
									...prev,
									userId: assignedUser._id,
									assignedTo: assignedUser._id,
							  }
							: null
					);
				}
				toast.success(`Ticket asignado a ${assignedUser.name}`);
			}
		} catch (err) {
			console.error('Error al asignar ticket:', err);
			toast.error('Error al asignar el ticket');
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
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
				<h1 className="text-xl sm:text-2xl font-bold">Mensajes</h1>
				<div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-10">
					<div className="flex gap-x-8 sm:gap-10 w-full sm:w-auto">
						<div className="w-full mx-auto flex items-end justify-end gap-4">
							<SearchInput
								value={searchQuery}
								onChange={setSearchQuery}
								placeholder="Buscar tickets..."
							/>
							<FilterSelect
								value={priorityFilter}
								onChange={setPriorityFilter}
								options={[
									{ label: 'Todas las prioridades', value: 'all' },
									{ label: 'Alta', value: 'high' },
									{ label: 'Media', value: 'medium' },
									{ label: 'Baja', value: 'low' },
								]}
								placeholder="Filtrar por prioridad"
							/>
						</div>
						<SortSelect
							value={sortOrder}
							onChange={value => setSortOrder(value as 'newest' | 'oldest')}
							options={[
								{ label: 'Más recientes', value: 'newest' },
								{ label: 'Más antiguos', value: 'oldest' },
							]}
						/>
					</div>
				</div>
			</div>
			<div className="flex flex-col md:flex-row h-screen overflow-hidden">
				{/* Lista de tickets */}
				<div className="w-full md:w-1/3 border-r flex flex-col h-[40vh] md:h-screen">
					<div className="flex justify-between items-center p-4 border-b bg-white">
						<h2 className="text-xl font-bold">
							{user?.role === 'admin' ? 'Tickets' : 'Mis Tickets'}
						</h2>
						<button
							onClick={() => setIsModalOpen(true)}
							className="flex items-center bg-white shadow-md text-brand-light  px-3 py-1.5 md:px-4 md:py-2 rounded hover:bg-brand-light hover:text-white transition-all duration-300 text-sm md:text-base"
						>
							<Plus className="w-4 h-4 mr-2" />
							Nuevo Ticket
						</button>
					</div>
					<div className="flex-1 overflow-y-auto bg-white">
						{filteredTickets.length === 0 ? (
							<div className="p-4 text-center text-gray-500">
								{user?.role === 'admin'
									? 'No hay tickets disponibles'
									: 'No tienes tickets asignados'}
							</div>
						) : (
							filteredTickets.map(ticket => (
								<div
									key={ticket._id}
									className={`p-3 md:p-4 border-b cursor-pointer ${
										selectedTicket?._id === ticket._id
											? 'bg-blue-100'
											: 'bg-white hover:bg-gray-50'
									}`}
									onClick={() => {
										setSelectedTicket(ticket);
										loadTicketMessages(ticket._id);
									}}
								>
									<h3 className="font-semibold text-sm md:text-base">
										{ticket.title}
									</h3>
									<p className="text-xs md:text-sm text-gray-600 line-clamp-2">
										{ticket.description}
									</p>
									<div className="flex justify-between items-center mt-2">
										<span
											className={`px-2 py-1 rounded text-xs md:text-sm ${
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
											<Select
												value={{
													value: ticket.priority,
													label:
														ticket.priority === 'low'
															? 'Baja'
															: ticket.priority === 'medium'
															? 'Media'
															: 'Alta',
												}}
												onChange={option =>
													option &&
													handlePriorityChange(ticket._id, option.value)
												}
												options={[
													{ value: 'low', label: 'Baja' },
													{ value: 'medium', label: 'Media' },
													{ value: 'high', label: 'Alta' },
												]}
												className="text-xs md:text-sm"
												styles={{
													control: (base, state) => ({
														...base,
														border: 'none',
														borderBottom: '2px solid #E5E7EB',
														borderRadius: '0',
														boxShadow: 'none',
														'&:hover': {
															borderBottom: '2px solid #4B5563',
														},
														minHeight: '32px',
														backgroundColor: 'white',
													}),
													menu: base => ({
														...base,
														backgroundColor: 'white',
														borderRadius: '0.375rem',
														boxShadow:
															'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
														zIndex: 50,
													}),
													option: (base, state) => ({
														...base,
														backgroundColor: state.isSelected
															? '#4B5563'
															: state.isFocused
															? '#F3F4F6'
															: 'white',
														color: state.isSelected ? 'white' : '#1F2937',
														'&:hover': {
															backgroundColor: state.isSelected
																? '#4B5563'
																: '#F3F4F6',
														},
														cursor: 'pointer',
														padding: '4px 8px',
														fontSize: '0.875rem',
													}),
													placeholder: base => ({
														...base,
														color: '#64748b',
													}),
													singleValue: base => ({
														...base,
														color: '#1F2937',
													}),
												}}
											/>
										)}
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Chat del ticket seleccionado */}
				<div className="flex-1 flex flex-col h-[60vh] md:h-screen">
					{selectedTicket ? (
						<>
							<div className="flex-1 p-3 md:p-4 overflow-y-auto bg-gray-50">
								{/* Información del ticket */}
								<div className="mb-4 p-3 bg-white rounded-lg shadow-sm">
									<h3 className="font-semibold text-sm md:text-base mb-2">
										{selectedTicket.title}
									</h3>
									<p className="text-sm text-gray-600 mb-2">
										{selectedTicket.description}
									</p>
									<div className="flex flex-wrap gap-2 items-center">
										<span
											className={`px-2 py-1 rounded text-xs ${
												selectedTicket.status === 'open'
													? 'bg-green-100 text-green-800'
													: selectedTicket.status === 'in-progress'
													? 'bg-yellow-100 text-yellow-800'
													: 'bg-red-100 text-red-800'
											}`}
										>
											{selectedTicket.status}
										</span>
									</div>
								</div>

								{/* Mensajes existentes */}
								{messages.map((message, index) => (
									<div
										key={index}
										className={`mb-4 ${
											message.sender === user?.email
												? 'text-right'
												: 'text-left'
										}`}
									>
										<div
											className={`inline-block p-3 rounded-lg max-w-[85%] md:max-w-[70%] ${
												message.sender === user?.email
													? 'bg-blue-500 text-white'
													: 'bg-gray-200'
											}`}
										>
											<p className="text-sm md:text-base">{message.content}</p>
											<p className="text-xs mt-1">
												{message.sender} ({message.senderRole})
											</p>
										</div>
									</div>
								))}
							</div>
							<div className="border-t p-3 md:p-4 bg-white">
								{selectedTicket.status === 'closed' ? (
									<div className="text-center text-gray-500 text-sm md:text-base">
										Este ticket está cerrado y no se pueden enviar más mensajes
									</div>
								) : (
									<div className="flex gap-2">
										<input
											type="text"
											value={newMessage}
											onChange={e => setNewMessage(e.target.value)}
											placeholder="Escribe un mensaje..."
											className="flex-1 border rounded px-3 py-2 text-sm md:text-base"
											onKeyPress={e =>
												e.key === 'Enter' && handleSendMessage(e)
											}
										/>
										<button
											onClick={e => handleSendMessage(e)}
											className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm md:text-base whitespace-nowrap"
										>
											Enviar
										</button>
										{user?.role === 'admin' && (
											<button
												onClick={handleCloseTicket}
												className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm md:text-base whitespace-nowrap"
											>
												Cerrar
											</button>
										)}
									</div>
								)}
							</div>
						</>
					) : (
						<div className="flex items-center justify-center h-full text-gray-500 text-sm md:text-base">
							Selecciona un ticket para ver los mensajes
						</div>
					)}
				</div>

				{/* Modal para crear nuevo ticket */}
				{isModalOpen && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<div className="bg-white p-4 md:p-6 rounded-lg w-full max-w-md">
							<h2 className="text-xl font-bold mb-4">Nuevo Ticket</h2>
							<form onSubmit={handleCreateTicket} className="space-y-4">
								<div>
									<label className="block text-sm font-medium mb-1">
										Título
									</label>
									<input
										type="text"
										value={newTicket.title}
										onChange={e =>
											setNewTicket({ ...newTicket, title: e.target.value })
										}
										className="w-full border rounded px-3 py-2 text-sm md:text-base"
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
											setNewTicket({
												...newTicket,
												description: e.target.value,
											})
										}
										className="w-full border rounded px-3 py-2 text-sm md:text-base"
										rows={4}
										required
									/>
								</div>
								{user?.role === 'admin' && (
									<>
										<div>
											<label className="block text-sm font-medium mb-1">
												Prioridad
											</label>
											<Select
												value={{
													value: newTicket.priority,
													label:
														newTicket.priority === 'low'
															? 'Baja'
															: newTicket.priority === 'medium'
															? 'Media'
															: 'Alta',
												}}
												onChange={option =>
													setNewTicket({
														...newTicket,
														priority: option?.value || 'medium',
													})
												}
												options={[
													{ value: 'low', label: 'Baja' },
													{ value: 'medium', label: 'Media' },
													{ value: 'high', label: 'Alta' },
												]}
												className="text-sm"
												styles={{
													control: (base, state) => ({
														...base,
														border: 'none',
														borderBottom: '2px solid #E5E7EB',
														borderRadius: '0',
														boxShadow: 'none',
														'&:hover': {
															borderBottom: '2px solid #4B5563',
														},
														minHeight: '42px',
														backgroundColor: 'white',
													}),
													menu: base => ({
														...base,
														backgroundColor: 'white',
														borderRadius: '0.375rem',
														boxShadow:
															'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
														zIndex: 50,
													}),
													option: (base, state) => ({
														...base,
														backgroundColor: state.isSelected
															? '#4B5563'
															: state.isFocused
															? '#F3F4F6'
															: 'white',
														color: state.isSelected ? 'white' : '#1F2937',
														'&:hover': {
															backgroundColor: state.isSelected
																? '#4B5563'
																: '#F3F4F6',
														},
														cursor: 'pointer',
														padding: '8px 12px',
													}),
													placeholder: base => ({
														...base,
														color: '#64748b',
													}),
													singleValue: base => ({
														...base,
														color: '#1F2937',
													}),
												}}
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-1">
												Asignar a
											</label>
											<Select
												value={
													newTicket.assignedTo
														? {
																value: newTicket.assignedTo,
																label:
																	users.find(
																		u => u._id === newTicket.assignedTo
																	)?.name || '',
														  }
														: null
												}
												onChange={option =>
													setNewTicket({
														...newTicket,
														assignedTo: option?.value || '',
													})
												}
												options={users.map(user => ({
													value: user._id,
													label: user.name,
												}))}
												placeholder="Seleccionar usuario..."
												className="text-sm"
												styles={{
													control: (base, state) => ({
														...base,
														border: 'none',
														borderBottom: '2px solid #E5E7EB',
														borderRadius: '0',
														boxShadow: 'none',
														'&:hover': {
															borderBottom: '2px solid #4B5563',
														},
														minHeight: '42px',
														backgroundColor: 'white',
													}),
													menu: base => ({
														...base,
														backgroundColor: 'white',
														borderRadius: '0.375rem',
														boxShadow:
															'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
														zIndex: 50,
													}),
													option: (base, state) => ({
														...base,
														backgroundColor: state.isSelected
															? '#4B5563'
															: state.isFocused
															? '#F3F4F6'
															: 'white',
														color: state.isSelected ? 'white' : '#1F2937',
														'&:hover': {
															backgroundColor: state.isSelected
																? '#4B5563'
																: '#F3F4F6',
														},
														cursor: 'pointer',
														padding: '8px 12px',
													}),
													placeholder: base => ({
														...base,
														color: '#64748b',
													}),
													singleValue: base => ({
														...base,
														color: '#1F2937',
													}),
												}}
											/>
										</div>
									</>
								)}
								<div className="flex justify-end gap-2">
									<button
										type="button"
										onClick={() => setIsModalOpen(false)}
										className="px-3 py-2 border rounded hover:bg-gray-100 text-sm md:text-base"
									>
										Cancelar
									</button>
									<button
										type="submit"
										className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm md:text-base"
									>
										Crear Ticket
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
