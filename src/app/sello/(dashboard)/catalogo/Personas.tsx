import React, { useEffect, useState } from 'react';
import {
	User,
	Pencil,
	Trash2,
	Plus,
	ChevronDown,
	ChevronUp,
	Hash,
	Tag,
	Calendar,
	Clock,
	Music,
	Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UpdateUserModal from '@/components/updateUserModal';
import { UpdatePublisherModal } from '@/components/UpdatePublisherModal';
import { UpdateContributorModal } from '@/components/UpdateContributorModal';
import UpdateArtistaModal from '@/components/updateArtistaModal';
import UpdateSelloModal from '@/components/UpdateSelloModal';
import SearchInput from '@/components/SearchInput';
import Pagination from '@/components/Pagination';
import SortSelect from '@/components/SortSelect';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Sello } from '@/types/sello';

// Definir la interfaz Artista para que coincida con la del componente UpdateArtistaModal
interface Artista {
	_id: string;
	external_id?: string | number;
	name: string;
	email: string;
	password?: string;
	picture?: string;
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
	[key: string]: any;
}

interface Persona {
	_id: string;
	name: string;
	email: string;
	picture?: string;
	role: string;
	status: string;
	external_id?: string | number;
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
	catalog_num?: number;
	year?: number;
	contract_received?: boolean;
	information_accepted?: boolean;
	label_approved?: boolean;
	assigned_artists?: string[];
	createdAt?: string;
	updatedAt?: string;
	parentName?: string;
	primary_genre?: string;
	[key: string]: any;
}

interface SelloData {
	_id: string;
	name: string;
	email: string;
	password: string;
	role: string;
	picture?: string;
	catalog_num: number;
	year: number;
	status: 'activo' | 'inactivo' | 'banneado';
	contract_received: boolean;
	information_accepted: boolean;
	label_approved: boolean;
	assigned_artists: any[];
	createdAt: string;
	updatedAt: string;
	tipo: 'principal' | 'subcuenta';
	parentId: string | null;
	parentName: string | null;
	primary_genre: string;
}

const Personas = () => {
	const [users, setUsers] = useState<Persona[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState('newest');
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [selectedUser, setSelectedUser] = useState<Persona | null>(null);
	const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [showPublisherModal, setShowPublisherModal] = useState(false);
	const [selectedPublisher, setSelectedPublisher] = useState<Persona | null>(
		null
	);
	const [showContributorModal, setShowContributorModal] = useState(false);
	const [selectedContributor, setSelectedContributor] =
		useState<Persona | null>(null);
	const [showArtistaModal, setShowArtistaModal] = useState(false);
	const [selectedArtista, setSelectedArtista] = useState<Persona | null>(null);
	const [showSelloModal, setShowSelloModal] = useState(false);
	const [selectedSello, setSelectedSello] = useState<Persona | null>(null);
	const [expandedUser, setExpandedUser] = useState<string | null>(null);

	const fetchUsers = async (
		page: number = 1,
		search: string = '',
		sort: string = 'newest'
	) => {
		try {
			console.log('Iniciando fetchUsers con:', { page, search, sort });
			const response = await fetch(
				`/api/admin/getAllPersonas?page=${page}${
					search ? `&search=${encodeURIComponent(search)}` : ''
				}&sort=${sort}`
			);
			if (response.ok) {
				const data = await response.json();
				console.log('Respuesta completa del servidor:', data);
				if (data.success) {
					console.log(
						'Datos obtenidos de la API (completos):',
						data.data.users
					);
					setUsers(data.data.users);
					setTotalPages(data.data.pagination.totalPages);
					setTotalItems(data.data.pagination.total);
					setCurrentPage(data.data.pagination.page);
				}
			}
			setIsLoading(false);
		} catch (error) {
			console.error('Error fetching users:', error);
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers(currentPage, searchQuery, sortBy);
	}, [currentPage, searchQuery, sortBy]);

	const handleDelete = async (e: React.MouseEvent, persona: Persona) => {
		e.preventDefault();
		e.stopPropagation();
		if (window.confirm('¿Estás seguro de que deseas eliminar esta persona?')) {
			try {
				const res = await fetch(`/api/admin/deleteUser/${persona._id}`, {
					method: 'DELETE',
				});
				if (res.ok) {
					// Actualizar la lista después de eliminar
					fetchUsers(currentPage, searchQuery, sortBy);
				}
			} catch (error) {
				console.error('Error deleting persona:', error);
			}
		}
	};

	const handleSave = async (persona: Persona) => {
		try {
			const res = await fetch(`/api/admin/updateUser/${persona._id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(persona),
			});
			if (res.ok) {
				// Actualizar la lista después de editar
				fetchUsers(currentPage, searchQuery, sortBy);
			}
		} catch (error) {
			console.error('Error updating persona:', error);
		}
	};

	const handleCreate = async (persona: Persona) => {
		try {
			const res = await fetch('/api/admin/createUser', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(persona),
			});
			if (res.ok) {
				// Actualizar la lista después de crear
				fetchUsers(currentPage, searchQuery, sortBy);
			}
		} catch (error) {
			console.error('Error creating persona:', error);
		}
	};

	const handleEdit = (e: React.MouseEvent, persona: Persona) => {
		try {
			e.preventDefault();
			e.stopPropagation();

			if (persona.role && persona.role.toLowerCase() === 'publisher') {
				if (!persona.external_id) {
					console.error('No se encontró el external_id del publisher');
					alert('Error: No se encontró el ID del publisher');
					return;
				}

				// Asegurarnos de que el email esté presente
				if (!persona.email) {
					console.error('No se encontró el email del publisher');
					alert('Error: No se encontró el email del publisher');
					return;
				}

				// Crear un objeto que coincida exactamente con la interfaz esperada
				const publisherData = {
					_id: persona._id,
					name: persona.name,
					email: persona.email,
					role: persona.role,
					external_id: persona.external_id,
					status: persona.status || 'activo',
					picture: persona.picture || '',
				};

				console.log('Es un publisher, datos completos:', publisherData);
				console.log('Email del publisher:', publisherData.email);
				setSelectedPublisher(publisherData);
				setShowPublisherModal(true);
			}
			// Verificar si el rol es "contributor"
			else if (persona.role && persona.role.toLowerCase() === 'contributor') {
				console.log('Es un contribuidor, abriendo modal de contribuidor');
				setSelectedContributor(persona);
				setShowContributorModal(true);
			}
			// Verificar si el rol es "artist" o "artista"
			else if (
				persona.role &&
				(persona.role.toLowerCase() === 'artist' ||
					persona.role.toLowerCase() === 'artista')
			) {
				console.log('Es un artista, abriendo modal de artista');
				// Asegurarse de que el artista tenga el external_id
				const artista = {
					...persona,
					external_id: persona.external_id || persona._id,
				};
				setSelectedArtista(artista);
				setShowArtistaModal(true);
			}
			// Verificar si el rol es "sello"
			else if (persona.role && persona.role.toLowerCase() === 'sello') {
				console.log('Es un sello, datos completos:', {
					...persona,
					email: persona.email,
					role: persona.role,
				});
				setSelectedSello(persona);
				setShowSelloModal(true);
			} else {
				// Para otros roles, usar el modal genérico
				setSelectedUser(persona);
				setIsUpdateModalOpen(true);
			}
		} catch (error) {
			console.error('Error en handleEdit:', error);
			alert('Error al editar el usuario');
		}
	};

	const handleUpdate = async (updatedUser: Persona) => {
		try {
			// Obtener los datos actualizados del usuario
			const response = await fetch(`/api/admin/getAllArtists`);
			const data = await response.json();
			if (data.success) {
				setUsers(data.data);
				setShowSuccessMessage(true);
				setTimeout(() => setShowSuccessMessage(false), 3000);
			}
		} catch (error) {
			console.error('Error refreshing personas:', error);
		}
	};

	const handlePublisherUpdate = async () => {
		try {
			// Recargar la lista de personas después de actualizar un publisher
			await fetchUsers(currentPage, searchQuery, sortBy);
			setShowSuccessMessage(true);
			setTimeout(() => setShowSuccessMessage(false), 3000);
		} catch (error) {
			console.error('Error al actualizar la lista de personas:', error);
			alert('Error al actualizar la lista de personas');
		}
	};

	const handleContributorUpdate = () => {
		// Recargar la lista de personas después de actualizar un contribuidor
		fetchUsers(currentPage, searchQuery, sortBy);
	};

	const handleArtistaUpdate = async (data: FormData | Artista) => {
		try {
			// Determinar si es FormData o JSON
			const isFormData = data instanceof FormData;
			const headers: HeadersInit = {};
			let body: string | FormData;

			if (isFormData) {
				// Si es FormData, no establecer Content-Type (el navegador lo hará automáticamente)
				body = data;
				console.log('Enviando FormData:', {
					name: data.get('name'),
					email: data.get('email'),
					external_id: data.get('external_id'),
					hasPicture: data.has('picture'),
				});
			} else {
				// Si es JSON, establecer Content-Type y convertir a string
				headers['Content-Type'] = 'application/json';
				body = JSON.stringify({
					...data,
					role: 'artista',
				});
				console.log('Enviando JSON:', {
					name: data.name,
					email: data.email,
					external_id: data.external_id,
					hasPicture: !!data.picture,
				});
			}

			// Obtener el external_id del artista
			const external_id = isFormData
				? data.get('external_id')?.toString()
				: data.external_id?.toString();

			if (!external_id) {
				throw new Error('No se encontró el external_id del artista');
			}

			const res = await fetch(`/api/admin/updateArtist/${external_id}`, {
				method: 'PUT',
				headers,
				body,
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Error al actualizar el artista');
			}

			const responseData = await res.json();
			console.log('Respuesta del servidor:', {
				success: responseData.success,
				artist: {
					_id: responseData.artist._id,
					name: responseData.artist.name,
					email: responseData.artist.email,
					picture: responseData.artist.picture
						? 'Imagen presente'
						: 'Sin imagen',
					external_id: responseData.artist.external_id,
					role: responseData.artist.role,
				},
			});

			if (responseData.success) {
				// Recargar la lista de personas después de actualizar un artista
				fetchUsers(currentPage, searchQuery, sortBy);
				setShowArtistaModal(false);
				setSelectedArtista(null);
			}
		} catch (error) {
			console.error('Error updating artist:', error);
			alert(
				error instanceof Error
					? error.message
					: 'Error al actualizar el artista'
			);
		}
	};

	const handleSelloUpdate = async (updatedSello: SelloData) => {
		try {
			// Asegurarse de que el sello tenga el rol 'sello'
			const selloToSave = {
				...updatedSello,
				role: 'sello',
			};

			const res = await fetch(`/api/admin/updateUser/${selloToSave._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(selloToSave),
			});
			const data = await res.json();
			if (data.success) {
				// Recargar la lista de personas después de actualizar un sello
				fetchUsers(currentPage, searchQuery, sortBy);
				setShowSelloModal(false);
				setSelectedSello(null);
			}
		} catch (error) {
			console.error('Error updating sello:', error);
			alert('Error al actualizar el sello');
		}
	};

	const toggleExpand = (userId: string) => {
		setExpandedUser(expandedUser === userId ? null : userId);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-dark"></div>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
					Usuarios
				</h1>
				<div className="flex justify-end gap-4 w-full sm:w-auto">
					<div className="flex items-center gap-x-10 justify-center gap-4">
						<SearchInput value={searchQuery} onChange={setSearchQuery} />
						<SortSelect
							value={sortBy}
							onChange={setSortBy}
							options={[
								{ value: 'newest', label: 'Más recientes' },
								{ value: 'oldest', label: 'Más antiguos' },
							]}
						/>
					</div>
					<button className="w-auto flex items-center justify-center gap-2 px-6 py-3 md:px-6 md:py-2 bg-white text-brand-light rounded-xl hover:bg-brand-dark hover:text-white transition-all duration-200 shadow-md group">
						<Plus
							size={18}
							className="text-brand-light group-hover:text-white"
						/>
						<span className="font-medium">Agregar</span>
					</button>
				</div>
			</div>

			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2 backdrop-blur-sm"
				>
					<span className="text-sm sm:text-base">Operación exitosa</span>
				</motion.div>
			)}

			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-400">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Usuario
							</th>
							<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Email
							</th>
							<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Rol
							</th>
							<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Estado
							</th>
							<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-300">
						{users.map(persona => (
							<React.Fragment key={persona._id}>
								<tr
									className="hover:bg-gray-50 cursor-pointer"
									onClick={() => toggleExpand(persona._id)}
								>
									<td className="px-4 sm:px-6 py-4 whitespace-nowrap">
										<div className="flex items-center">
											<div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
												{persona?.picture ? (
													<motion.img
														whileHover={{ scale: 1.05 }}
														transition={{ duration: 0.2 }}
														src={persona.picture}
														alt={persona.name}
														className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
													/>
												) : (
													<div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-full">
														<User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
													</div>
												)}
											</div>
											<div className="ml-3 sm:ml-4">
												<div className="text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">
													{persona.name}
												</div>
											</div>
										</div>
									</td>
									<td className="px-4 sm:px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900 truncate max-w-[150px] sm:max-w-none">
											{persona.email}
										</div>
									</td>
									<td className="px-4 sm:px-6 py-4 whitespace-nowrap">
										<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
											{persona.role}
										</span>
									</td>
									<td className="px-4 sm:px-6 py-4 whitespace-nowrap">
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
												persona.status === 'activo'
													? 'bg-green-100 text-green-800'
													: 'bg-red-100 text-red-800'
											}`}
										>
											{persona.status}
										</span>
									</td>
									<td className="px-4 sm:px-6 py-4 whitespace-nowrap">
										<div className="flex items-center space-x-2">
											<motion.button
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={e => {
													console.log('Botón de editar clickeado');
													e.preventDefault();
													e.stopPropagation();
													console.log('Click en botón de editar:', persona);
													try {
														handleEdit(e, persona);
													} catch (error) {
														console.error('Error en handleEdit:', error);
													}
												}}
												className="p-2 sm:p-2.5 flex items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
											>
												<Pencil
													className="text-brand-light hover:text-brand-dark"
													size={16}
												/>
											</motion.button>
											<motion.button
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={e => {
													e.stopPropagation();
													handleDelete(e, persona);
												}}
												disabled={isDeleting === persona._id}
												className="p-2 sm:p-2.5 flex items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
											>
												{isDeleting === persona._id ? (
													<div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
												) : (
													<Trash2
														className="text-red-500 hover:text-red-700"
														size={16}
													/>
												)}
											</motion.button>
											{expandedUser === persona._id ? (
												<ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
											) : (
												<ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
											)}
										</div>
									</td>
								</tr>
								<AnimatePresence>
									{expandedUser === persona._id && (
										<tr>
											<td colSpan={5} className="px-4 sm:px-6 py-4 bg-gray-50">
												<motion.div
													initial={{ height: 0, opacity: 0 }}
													animate={{ height: 'auto', opacity: 1 }}
													exit={{ height: 0, opacity: 0 }}
													transition={{ duration: 0.2 }}
													className="overflow-hidden"
												>
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-sm">
														<div className="space-y-3">
															<p className="flex items-start gap-2">
																<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																	<Hash className="h-4 w-4 text-brand-light" />{' '}
																	ID:
																</span>
																<span className="text-gray-600 text-sm break-all">
																	{persona._id}
																</span>
															</p>
															{persona.external_id && (
																<p className="flex items-start gap-2">
																	<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																		<Tag className="h-4 w-4 text-brand-light" />{' '}
																		External ID:
																	</span>
																	<span className="text-gray-600 text-sm break-all">
																		{persona.external_id}
																	</span>
																</p>
															)}
															{persona.role === 'artista' && (
																<>
																	<p className="flex items-start gap-2">
																		<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																			<Music className="h-4 w-4 text-brand-light" />{' '}
																			Amazon Music:
																		</span>
																		<span
																			className={`text-gray-600 text-sm ${
																				!persona.amazon_music_identifier
																					? 'text-gray-400 italic'
																					: ''
																			}`}
																		>
																			{persona.amazon_music_identifier ||
																				'Cuenta no encontrada'}
																		</span>
																	</p>
																	<p className="flex items-start gap-2">
																		<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																			<Music className="h-4 w-4 text-brand-light" />{' '}
																			Apple Music:
																		</span>
																		<span
																			className={`text-gray-600 text-sm ${
																				!persona.apple_identifier
																					? 'text-gray-400 italic'
																					: ''
																			}`}
																		>
																			{persona.apple_identifier ||
																				'Cuenta no encontrada'}
																		</span>
																	</p>
																	<p className="flex items-start gap-2">
																		<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																			<Music className="h-4 w-4 text-brand-light" />{' '}
																			Deezer:
																		</span>
																		<span
																			className={`text-gray-600 text-sm ${
																				!persona.deezer_identifier
																					? 'text-gray-400 italic'
																					: ''
																			}`}
																		>
																			{persona.deezer_identifier ||
																				'Cuenta no encontrada'}
																		</span>
																	</p>
																	<p className="flex items-start gap-2">
																		<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																			<Music className="h-4 w-4 text-brand-light" />{' '}
																			Spotify:
																		</span>
																		<span
																			className={`text-gray-600 text-sm ${
																				!persona.spotify_identifier
																					? 'text-gray-400 italic'
																					: ''
																			}`}
																		>
																			{persona.spotify_identifier ||
																				'Cuenta no encontrada'}
																		</span>
																	</p>
																</>
															)}
															{persona.role === 'sello' && (
																<>
																	{persona.catalog_num && (
																		<p className="flex items-start gap-2">
																			<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																				<Tag className="h-4 w-4 text-brand-light" />{' '}
																				Catálogo:
																			</span>
																			<span className="text-gray-600 text-sm">
																				{persona.catalog_num}
																			</span>
																		</p>
																	)}
																	{persona.year && (
																		<p className="flex items-start gap-2">
																			<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																				<Calendar className="h-4 w-4 text-brand-light" />{' '}
																				Año:
																			</span>
																			<span className="text-gray-600 text-sm">
																				{persona.year}
																			</span>
																		</p>
																	)}
																	{persona.primary_genre && (
																		<p className="flex items-start gap-2">
																			<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																				<Music className="h-4 w-4 text-brand-light" />{' '}
																				Género:
																			</span>
																			<span className="text-gray-600 text-sm">
																				{persona.primary_genre}
																			</span>
																		</p>
																	)}
																</>
															)}
														</div>
														<div className="space-y-3">
															{persona.createdAt && (
																<p className="flex items-start gap-2">
																	<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																		<Clock className="h-4 w-4 text-brand-light" />{' '}
																		Creado:
																	</span>
																	<span className="text-gray-600 text-sm">
																		{formatDate(persona.createdAt)}
																	</span>
																</p>
															)}
															{persona.updatedAt && (
																<p className="flex items-start gap-2">
																	<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																		<Clock className="h-4 w-4 text-brand-light" />{' '}
																		Actualizado:
																	</span>
																	<span className="text-gray-600 text-sm">
																		{formatDate(persona.updatedAt)}
																	</span>
																</p>
															)}
															{persona.parentName && (
																<p className="flex items-start gap-2">
																	<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																		<Building2 className="h-4 w-4 text-brand-light" />{' '}
																		Cuenta Principal:
																	</span>
																	<span className="text-gray-600 text-sm">
																		{persona.parentName}
																	</span>
																</p>
															)}
														</div>
													</div>
												</motion.div>
											</td>
										</tr>
									)}
								</AnimatePresence>
							</React.Fragment>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={totalItems}
				itemsPerPage={5}
				onPageChange={setCurrentPage}
				className="mt-4"
			/>

			{selectedUser && (
				<UpdateUserModal
					isOpen={isUpdateModalOpen}
					onClose={() => {
						setIsUpdateModalOpen(false);
						setSelectedUser(null);
					}}
					user={selectedUser}
					onUpdate={handleUpdate}
				/>
			)}

			{showPublisherModal && selectedPublisher && (
				<>
					{console.log(
						'Renderizando modal de publisher con datos:',
						selectedPublisher
					)}
					<UpdatePublisherModal
						publisher={selectedPublisher}
						onUpdate={handlePublisherUpdate}
						isOpen={showPublisherModal}
						onClose={() => {
							console.log('Cerrando modal de publisher');
							setShowPublisherModal(false);
							setSelectedPublisher(null);
						}}
					/>
				</>
			)}

			{showContributorModal && selectedContributor && (
				<>
					{console.log('Renderizando modal de contribuidor')}
					<UpdateContributorModal
						contributor={{
							id: selectedContributor._id,
							external_id: selectedContributor.external_id
								? Number(selectedContributor.external_id)
								: 0,
							name: selectedContributor.name,
							email: selectedContributor.email || '',
							status:
								selectedContributor.status === 'inactivo' ||
								selectedContributor.status === 'banneado'
									? selectedContributor.status
									: 'activo',
						}}
						onUpdate={handleContributorUpdate}
						isOpen={showContributorModal}
						onClose={() => {
							console.log('Cerrando modal de contribuidor');
							setShowContributorModal(false);
							setSelectedContributor(null);
						}}
					/>
				</>
			)}

			{showArtistaModal && selectedArtista && (
				<>
					{console.log('Renderizando modal de artista')}
					<UpdateArtistaModal
						artista={selectedArtista}
						isOpen={!!selectedArtista}
						onClose={() => {
							setSelectedArtista(null);
						}}
						onSave={async (data: FormData | Artista) => {
							await handleArtistaUpdate(data);
						}}
					/>
				</>
			)}

			{showSelloModal && selectedSello && (
				<>
					{console.log(
						'Datos del sello seleccionado antes de pasar al modal:',
						{
							selectedSello,
							email: selectedSello.email,
							role: selectedSello.role,
						}
					)}
					<UpdateSelloModal
						sello={
							{
								_id: selectedSello._id,
								external_id: selectedSello.external_id,
								name: selectedSello.name,
								email: selectedSello.email || '',
								password: selectedSello.password || '',
								role: 'sello',
								picture: selectedSello.picture || undefined,
								catalog_num: selectedSello.catalog_num || 0,
								year: selectedSello.year || 0,
								status: (selectedSello.status || 'activo') as
									| 'activo'
									| 'inactivo'
									| 'banneado',
								contract_received: selectedSello.contract_received || false,
								information_accepted:
									selectedSello.information_accepted || false,
								label_approved: selectedSello.label_approved || false,
								assigned_artists: selectedSello.assigned_artists || [],
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
								tipo: 'principal',
								parentId: null,
								parentName: null,
								primary_genre: selectedSello.primary_genre || '',
							} as SelloData
						}
						isOpen={showSelloModal}
						onClose={() => {
							console.log('Cerrando modal de sello');
							setShowSelloModal(false);
							setSelectedSello(null);
						}}
						onSave={async (formData: globalThis.FormData) => {
							const data = JSON.parse(formData.get('data') as string);
							await handleSelloUpdate(data);
						}}
					/>
				</>
			)}
		</div>
	);
};

export default Personas;
