'use client';

import { useEffect, useState, useRef } from 'react';
import {
	Pencil,
	Trash2,
	Plus,
	X,
	AlertTriangle,
	CheckCircle,
	Mail,
	KeyRound,
	Copy,
	XCircle,
	Users,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import UpdateArtistaModal from '@/components/updateArtistaModal';
import UpdateSelloModal from '@/components/UpdateSelloModal';
import UpdateAdminModal from '@/components/UpdateAdminModal';
import { UpdateContributorModal } from '@/components/UpdateContributorModal';
import { UpdatePublisherModal } from '@/components/UpdatePublisherModal';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/Pagination';
import SearchInput from '@/components/SearchInput';
import SortSelect from '@/components/SortSelect';
import RoleFilter, { RoleOption } from '@/components/RoleFilter';
import Select from 'react-select';

interface User {
	_id: string;
	name: string;
	email: string;
	role: string;
	picture?: string;
	status?: string;
	permissions?: string[];
	subaccounts?: any[];
	artists?: any[];
	catalog_num?: number;
	year?: number;
	contract_received?: boolean;
	information_accepted?: boolean;
	label_approved?: boolean;
	assigned_artists?: string[];
	createdAt?: string;
	updatedAt?: string;

	external_id?: string | number;
	type: string;
	[key: string]: any;
}

const roleOptions = [
	{ value: 'admin', label: 'Admin' },
	{ value: 'artista', label: 'Artista' },
	{ value: 'contributor', label: 'Contributor' },
	{ value: 'sello', label: 'Sello' },
	{ value: 'publisher', label: 'Publisher' },
];

const selectStyles = {
	control: (base: any, state: any) => ({
		...base,
		backgroundColor: 'transparent',
		border: 'none',
		borderBottom: '2px solid #E5E7EB',
		borderRadius: '0',
		boxShadow: 'none',
		minHeight: '38px',
		'&:hover': {
			borderBottom: '2px solid #4B5563',
		},
		'&:focus-within': {
			borderBottom: '2px solid #4B5563',
			boxShadow: 'none',
		},
	}),
	option: (base: any, state: any) => ({
		...base,
		backgroundColor: state.isSelected
			? '#4B5563'
			: state.isFocused
			? '#F3F4F6'
			: 'white',
		color: state.isSelected ? 'white' : '#1F2937',
		cursor: 'pointer',
		'&:hover': {
			backgroundColor: state.isSelected ? '#4B5563' : '#F3F4F6',
		},
	}),
	menu: (base: any) => ({
		...base,
		zIndex: 9999,
		backgroundColor: 'white',
		borderRadius: '0.375rem',
		boxShadow:
			'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
	}),
	menuList: (base: any) => ({
		...base,
		padding: '0.5rem 0',
	}),
	indicatorSeparator: () => ({
		display: 'none',
	}),
	dropdownIndicator: (base: any) => ({
		...base,
		color: '#9CA3AF',
		'&:hover': {
			color: '#4B5563',
		},
	}),
	clearIndicator: (base: any) => ({
		...base,
		color: '#9CA3AF',
		'&:hover': {
			color: '#4B5563',
		},
	}),
	valueContainer: (base: any) => ({
		...base,
		padding: '0 0.5rem',
	}),
	input: (base: any) => ({
		...base,
		margin: 0,
		padding: 0,
	}),
	placeholder: (base: any) => ({
		...base,
		color: '#9CA3AF',
	}),
	singleValue: (base: any) => ({
		...base,
		color: '#1F2937',
	}),
};

export default function UsuariosPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [editedUser, setEditedUser] = useState<User | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showArtistModal, setShowArtistModal] = useState(false);
	const [selectedArtist, setSelectedArtist] = useState<User | null>(null);
	const [showSelloModal, setShowSelloModal] = useState(false);
	const [selectedSello, setSelectedSello] = useState<User | null>(null);
	const [showAdminModal, setShowAdminModal] = useState(false);
	const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
	const [showContributorModal, setShowContributorModal] = useState(false);
	const [selectedContributor, setSelectedContributor] = useState<User | null>(
		null
	);
	const [showPublisherModal, setShowPublisherModal] = useState(false);
	const [selectedPublisher, setSelectedPublisher] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [userToDelete, setUserToDelete] = useState<any>(null);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [deletedUserName, setDeletedUserName] = useState<string>('');
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState('newest');
	const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
	const [showInviteModal, setShowInviteModal] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState<{
		total: number;
		loaded: number;
		percentage: number;
		totalChunks: number;
		filesCompleted: number;
	} | null>(null);

	const router = useRouter();

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const res = await fetch(
					`/api/admin/getAllUsers?page=${currentPage}${
						searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
					}&sort=${sortBy}`
				);
				const data = await res.json();
				if (data.success) {
					let filteredUsers = data.data.users;

					// Aplicar filtro de rol si está seleccionado
					if (selectedRole && selectedRole.value !== 'todos') {
						filteredUsers = data.data.users.filter(
							(user: any) => user.role === selectedRole.value
						);
					}

					setUsers(filteredUsers);

					setTotalPages(data.data.pagination.totalPages);
					setTotalItems(data.data.pagination.total);
				} else {
					setError(data.error || 'No hay usuarios disponibles');
				}
			} catch (error) {
				console.error('Error fetching users:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchUsers();
	}, [currentPage, searchQuery, sortBy, selectedRole]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-dark"></div>
			</div>
		);
	}
	if (error && error.length > 0) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="text-red-500 flex flex-col items-center gap-4">
					<XCircle className="h-12 w-12" />
					<p className="text-lg font-medium">{error}</p>
				</div>
			</div>
		);
	}
	if (users.length === 0) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="text-gray-500 flex flex-col items-center gap-4">
					<Users className="h-12 w-12" />
					<p className="text-lg font-medium">No hay usuarios disponibles</p>
				</div>
			</div>
		);
	}

	const handleEdit = (user: User) => {
		// Verificar si el rol es "artist" o "artista" (ignorando mayúsculas/minúsculas)
		if (
			user.role &&
			(user.role.toLowerCase() === 'artist' ||
				user.role.toLowerCase() === 'artista')
		) {
			// Asegurarse de que el artista tenga el external_id
			const artista = {
				...user,
				external_id: user.external_id || user._id,
			};
			setSelectedArtist(artista);
			setShowArtistModal(true);
		}
		// Verificar si el rol es "sello"
		else if (user.role && user.role.toLowerCase() === 'sello') {
			// Adaptar los datos del usuario al formato esperado por UpdateSelloModal
			const adaptedSelloData = {
				_id: user._id,
				external_id: user.external_id || user._id, // Asegurarnos de tener un external_id
				name: user.name,
				email: user.email || '',
				password: user.password || '',
				role: 'sello',
				picture: user.picture || '',
				catalog_num: user.catalog_num || 0,
				year: user.year || 0,
				status: (user.status || 'activo') as 'activo' | 'inactivo' | 'banneado',
				contract_received: user.contract_received || false,
				information_accepted: user.information_accepted || false,
				label_approved: user.label_approved || false,
				assigned_artists: user.assigned_artists || [],
				createdAt: user.createdAt || new Date().toISOString(),
				updatedAt: user.updatedAt || new Date().toISOString(),
				tipo: 'principal',
				parentId: null,
				parentName: null,
				primary_genre: user.primary_genre || '',
			};
			// Usar any para evitar problemas de tipo
			setSelectedSello(adaptedSelloData as any);
			setShowSelloModal(true);
		}
		// Verificar si el rol es "admin"
		else if (user.role && user.role.toLowerCase() === 'admin') {
			setSelectedAdmin(user);
			setShowAdminModal(true);
		}
		// Verificar si el rol es "contributor"
		else if (user.role && user.role.toLowerCase() === 'contributor') {
			setSelectedContributor(user);
			setShowContributorModal(true);
		}
		// Verificar si el rol es "publisher"
		else if (user.role && user.role.toLowerCase() === 'publisher') {
			setSelectedPublisher(user);
			setShowPublisherModal(true);
		} else {
			setEditingUserId(user._id);
			setEditedUser({ ...user });
		}
	};

	const handleDeleteClick = (user: any) => {
		setUserToDelete(user);
		setShowDeleteModal(true);
	};
	const createChunks = (file: File, chunkSize: number = 250 * 1024) => {
		const chunks = [];
		const totalChunks = Math.ceil(file.size / chunkSize);

		for (let i = 0; i < totalChunks; i++) {
			const start = i * chunkSize;
			const end = Math.min(start + chunkSize, file.size);
			chunks.push({
				chunk: file.slice(start, end),
				index: i,
				total: totalChunks,
			});
		}

		return chunks;
	};

	// Función para subir un chunk
	const uploadChunk = async (
		chunk: Blob,
		chunkIndex: number,
		totalChunks: number,
		trackData: any,
		fileName: string,
		url: string
	) => {
		const formData = new FormData();
		formData.append('chunk', chunk);
		formData.append('chunkIndex', chunkIndex.toString());
		formData.append('totalChunks', totalChunks.toString());
		formData.append('fileType', fileName.split('.').pop() || '');
		formData.append('data', JSON.stringify(trackData));
		formData.append('fileName', fileName);

		const ex_ID = selectedSello?.external_id;
		const response = await fetch(url, {
			method: 'PUT',
			body: formData,
		});
		if (response.ok) {
			setUploadProgress(prev => {
				if (!prev) return prev;
				const newLoaded = prev.loaded + 1;
				return {
					...prev,
					loaded: newLoaded,
					percentage: Math.floor((newLoaded / prev.totalChunks) * 100),
				};
			});
		}

		return response.json();
	};

	// Función para subir archivo completo por chunks
	const uploadFileByChunks = async (
		file: File,
		trackData: any,
		url: string
	) => {
		const chunks = createChunks(file);
		let lastResponse = null;

		for (let i = 0; i < chunks.length; i++) {
			const { chunk, index, total } = chunks[i];
			lastResponse = await uploadChunk(
				chunk,
				index,
				total,
				trackData,
				file.name,
				url
			);
		}

		return lastResponse;
	};
	const handleConfirmDelete = async () => {
		if (!userToDelete) return;
		setIsDeleting(true);
		setDeleteError(null);

		try {
			const response = await fetch(
				`/api/admin/deleteUser/${userToDelete._id}`,
				{
					method: 'DELETE',
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Error al eliminar el usuario');
			}

			// Guardamos el nombre del usuario eliminado
			setDeletedUserName(userToDelete.name);

			// Actualizamos el estado local
			setUsers(prevUsers => prevUsers.filter(u => u._id !== userToDelete._id));

			// Cerramos el modal y mostramos el mensaje de éxito
			setShowDeleteModal(false);
			setUserToDelete(null);
			setShowSuccessMessage(true);
			router.refresh();

			// Ocultamos el mensaje después de 5 segundos
			setTimeout(() => {
				setShowSuccessMessage(false);
				setDeletedUserName('');
			}, 5000);
		} catch (error) {
			console.error('Error deleting user:', error);
			setDeleteError(
				error instanceof Error ? error.message : 'Error al eliminar el usuario'
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleContributorUpdate = async (updatedData: {
		name: string;
		email: string;
		status: string;
		password: string;
	}) => {
		try {
			// Primero actualizamos el contribuidor
			const updateResponse = await fetch(
				`/api/admin/updateContributor/${selectedContributor?.external_id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(updatedData),
				}
			);

			const updateData = await updateResponse.json();

			if (!updateResponse.ok) {
				const errorMessage =
					typeof updateData.error === 'object'
						? Object.entries(updateData.error)
								.map(([key, value]) => {
									if (Array.isArray(value)) {
										// Manejar arrays de objetos como artists: [{ artist: ['error'] }]
										const arrayErrors = value
											.map((item, index) => {
												if (typeof item === 'object' && item !== null) {
													return Object.entries(item)
														.map(([nestedKey, nestedValue]) => {
															if (Array.isArray(nestedValue)) {
																return `${nestedKey}: ${nestedValue.join(
																	', '
																)}`;
															}
															return `${nestedKey}: ${nestedValue}`;
														})
														.join(', ');
												}
												return String(item);
											})
											.join(', ');
										return `${key}: ${arrayErrors}`;
									}
									if (typeof value === 'object' && value !== null) {
										// Manejar estructuras anidadas como { artists: [{ artist: ['error'] }] }
										const nestedErrors = Object.entries(value)
											.map(([nestedKey, nestedValue]) => {
												if (Array.isArray(nestedValue)) {
													return `${nestedKey}: ${nestedValue.join(', ')}`;
												}
												if (
													typeof nestedValue === 'object' &&
													nestedValue !== null
												) {
													return `${nestedKey}: ${Object.values(nestedValue)
														.flat()
														.join(', ')}`;
												}
												return `${nestedKey}: ${nestedValue}`;
											})
											.join(', ');
										return `${key}: ${nestedErrors}`;
									}
									return `${key}: ${value}`;
								})
								.filter(Boolean)
								.join('\n')
						: updateData.error;
				toast.error(errorMessage);
				setError(errorMessage);
				throw new Error(errorMessage);
			}

			// Si la actualización fue exitosa, recargamos la lista de usuarios
			const res = await fetch(
				`/api/admin/getAllUsers?page=${currentPage}${
					searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
				}&sort=${sortBy}`
			);
			const data = await res.json();
			if (data.success) {
				setUsers(data.data.users);
				setTotalPages(data.data.pagination.totalPages);
				setTotalItems(data.data.pagination.total);
				toast.success('Contribuidor actualizado con éxito');
			} else {
				throw new Error(data.error || 'Error al recargar la lista de usuarios');
			}
		} catch (error) {
			console.error('Error updating contributor:', error);
			toast.error(
				error instanceof Error
					? error.message
					: 'Error al actualizar el contribuidor'
			);
		}
	};

	const handlePublisherUpdate = (updatedData: {
		name: string;
		email: string;
		status: string;
		password?: string;
	}) => {
		// Recargar la lista de usuarios después de actualizar un publisher
		const fetchUsers = async () => {
			const res = await fetch(
				`/api/admin/getAllUsers?page=${currentPage}${
					searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
				}`
			);
			const data = await res.json();
			if (!res.ok) {
				const errorMessage =
					typeof data.error === 'object'
						? Object.entries(data.error)
								.map(([key, value]) => {
									if (Array.isArray(value)) {
										// Manejar arrays de objetos como artists: [{ artist: ['error'] }]
										const arrayErrors = value
											.map((item, index) => {
												if (typeof item === 'object' && item !== null) {
													return Object.entries(item)
														.map(([nestedKey, nestedValue]) => {
															if (Array.isArray(nestedValue)) {
																return `${nestedKey}: ${nestedValue.join(
																	', '
																)}`;
															}
															return `${nestedKey}: ${nestedValue}`;
														})
														.join(', ');
												}
												return String(item);
											})
											.join(', ');
										return `${key}: ${arrayErrors}`;
									}
									if (typeof value === 'object' && value !== null) {
										// Manejar estructuras anidadas como { artists: [{ artist: ['error'] }] }
										const nestedErrors = Object.entries(value)
											.map(([nestedKey, nestedValue]) => {
												if (Array.isArray(nestedValue)) {
													return `${nestedKey}: ${nestedValue.join(', ')}`;
												}
												if (
													typeof nestedValue === 'object' &&
													nestedValue !== null
												) {
													return `${nestedKey}: ${Object.values(nestedValue)
														.flat()
														.join(', ')}`;
												}
												return `${nestedKey}: ${nestedValue}`;
											})
											.join(', ');
										return `${key}: ${nestedErrors}`;
									}
									return `${key}: ${value}`;
								})
								.filter(Boolean)
								.join('\n')
						: data.error;
				toast.error(errorMessage);
				setError(errorMessage);
				throw new Error(errorMessage);
			}
			if (data.success) {
				setUsers(data.data.users);
				setTotalPages(data.data.pagination.totalPages);
				setTotalItems(data.data.pagination.total);
			}
		};
		fetchUsers();
	};

	const handleArtistSave = async (updatedArtist: any) => {
		try {
			const URL = `/api/admin/updateArtist/${selectedArtist?.external_id}`;
			// Determinar si es FormData o JSON
			const isFormData = updatedArtist instanceof FormData;

			let picture = false;
			if (isFormData) {
				const fil = updatedArtist.get('picture');
				picture = fil instanceof File;
				const file = updatedArtist.get('picture') as File;
				if (picture) {
					const dataToUpdate = JSON.parse(updatedArtist.get('data') as string);
					const dat = await uploadFileByChunks(file, dataToUpdate, URL);
					if (!dat) {
						const errorMessage =
							typeof dat.error === 'object'
								? Object.entries(dat.error)
										.map(([key, value]) => {
											if (Array.isArray(value)) {
												// Manejar arrays de objetos como artists: [{ artist: ['error'] }]
												const arrayErrors = value
													.map((item, index) => {
														if (typeof item === 'object' && item !== null) {
															return Object.entries(item)
																.map(([nestedKey, nestedValue]) => {
																	if (Array.isArray(nestedValue)) {
																		return `${nestedKey}: ${nestedValue.join(
																			', '
																		)}`;
																	}
																	return `${nestedKey}: ${nestedValue}`;
																})
																.join(', ');
														}
														return String(item);
													})
													.join(', ');
												return `${key}: ${arrayErrors}`;
											}
											if (typeof value === 'object' && value !== null) {
												// Manejar estructuras anidadas como { artists: [{ artist: ['error'] }] }
												const nestedErrors = Object.entries(value)
													.map(([nestedKey, nestedValue]) => {
														if (Array.isArray(nestedValue)) {
															return `${nestedKey}: ${nestedValue.join(', ')}`;
														}
														if (
															typeof nestedValue === 'object' &&
															nestedValue !== null
														) {
															return `${nestedKey}: ${Object.values(nestedValue)
																.flat()
																.join(', ')}`;
														}
														return `${nestedKey}: ${nestedValue}`;
													})
													.join(', ');
												return `${key}: ${nestedErrors}`;
											}
											return `${key}: ${value}`;
										})
										.filter(Boolean)
										.join('\n')
								: dat.error;
						setError(errorMessage);
						console.log('errorMessage', errorMessage);
						throw new Error(errorMessage);
					}
					toast.success('Artista actualizado correctamente');
				} else {
					const res = await fetch(URL, {
						method: 'PUT',
						body: updatedArtist,
					});
					if (!res.ok) {
						const err = await res.json();
						const errorMessage =
							typeof err.error === 'object'
								? Object.entries(err.error)
										.map(([key, value]) => {
											if (Array.isArray(value)) {
												// Manejar arrays de objetos como artists: [{ artist: ['error'] }]
												const arrayErrors = value
													.map((item, index) => {
														if (typeof item === 'object' && item !== null) {
															return Object.entries(item)
																.map(([nestedKey, nestedValue]) => {
																	if (Array.isArray(nestedValue)) {
																		return `${nestedKey}: ${nestedValue.join(
																			', '
																		)}`;
																	}
																	return `${nestedKey}: ${nestedValue}`;
																})
																.join(', ');
														}
														return String(item);
													})
													.join(', ');
												return `${key}: ${arrayErrors}`;
											}
											if (typeof value === 'object' && value !== null) {
												// Manejar estructuras anidadas como { artists: [{ artist: ['error'] }] }
												const nestedErrors = Object.entries(value)
													.map(([nestedKey, nestedValue]) => {
														if (Array.isArray(nestedValue)) {
															return `${nestedKey}: ${nestedValue.join(', ')}`;
														}
														if (
															typeof nestedValue === 'object' &&
															nestedValue !== null
														) {
															return `${nestedKey}: ${Object.values(nestedValue)
																.flat()
																.join(', ')}`;
														}
														return `${nestedKey}: ${nestedValue}`;
													})
													.join(', ');
												return `${key}: ${nestedErrors}`;
											}
											return `${key}: ${value}`;
										})
										.filter(Boolean)
										.join('\n')
								: err.error;
						setError(errorMessage);
						throw new Error(errorMessage);
					}
					toast.success('Artista actualizado correctamente');
				}
			}
		} catch (error) {
			console.error('Error updating artist:', error);
			toast.error(
				error instanceof Error
					? error.message
					: 'Error al actualizar el artista'
			);
		}
	};

	const handleSelloSave = async (formData: FormData) => {
		try {
			const picture = formData.get('picture');

			const URL = `/api/updateSello/${selectedSello?.external_id}`;
			if (picture instanceof File) {
				const dataString = formData.get('data') as string;
				let dat = {};

				if (dataString) {
					dat = JSON.parse(dataString);
				}
				const createResponse = await uploadFileByChunks(picture, dat, URL);
				if (!createResponse.success) {
					const errorMessage =
						typeof createResponse.error === 'object'
							? Object.entries(createResponse.error)
									.map(([key, value]) => {
										if (Array.isArray(value)) {
											// Manejar arrays de objetos como artists: [{ artist: ['error'] }]
											const arrayErrors = value
												.map((item, index) => {
													if (typeof item === 'object' && item !== null) {
														return Object.entries(item)
															.map(([nestedKey, nestedValue]) => {
																if (Array.isArray(nestedValue)) {
																	return `${nestedKey}: ${nestedValue.join(
																		', '
																	)}`;
																}
																return `${nestedKey}: ${nestedValue}`;
															})
															.join(', ');
													}
													return String(item);
												})
												.join(', ');
											return `${key}: ${arrayErrors}`;
										}
										if (typeof value === 'object' && value !== null) {
											// Manejar estructuras anidadas como { artists: [{ artist: ['error'] }] }
											const nestedErrors = Object.entries(value)
												.map(([nestedKey, nestedValue]) => {
													if (Array.isArray(nestedValue)) {
														return `${nestedKey}: ${nestedValue.join(', ')}`;
													}
													if (
														typeof nestedValue === 'object' &&
														nestedValue !== null
													) {
														return `${nestedKey}: ${Object.values(nestedValue)
															.flat()
															.join(', ')}`;
													}
													return `${nestedKey}: ${nestedValue}`;
												})
												.join(', ');
											return `${key}: ${nestedErrors}`;
										}
										return `${key}: ${value}`;
									})
									.filter(Boolean)
									.join('\n')
							: createResponse.error;
					setError(errorMessage);
					console.log('errorMessage: ', errorMessage);
					throw new Error(errorMessage || 'Error al crear el lanzamiento');
				}
				const res = await fetch(
					`/api/admin/getAllUsers?page=${currentPage}${
						searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
					}&sort=${sortBy}`
				);
				const data = await res.json();
				if (data.success) {
					setUsers(data.data.users);
					setTotalPages(data.data.pagination.totalPages);
					setTotalItems(data.data.pagination.total);
				}
				setShowSelloModal(false);
				setSelectedSello(null);
				toast.success('Sello actualizado correctamente');
			} else {
				const res = await fetch(URL, {
					method: 'PUT',
					body: formData,
				});
				if (!res.ok) {
					const createResponse = await res.json();
					const errorMessage =
						typeof createResponse.error === 'object'
							? Object.entries(createResponse.error)
									.map(([key, value]) => {
										if (Array.isArray(value)) {
											// Manejar arrays de objetos como artists: [{ artist: ['error'] }]
											const arrayErrors = value
												.map((item, index) => {
													if (typeof item === 'object' && item !== null) {
														return Object.entries(item)
															.map(([nestedKey, nestedValue]) => {
																if (Array.isArray(nestedValue)) {
																	return `${nestedKey}: ${nestedValue.join(
																		', '
																	)}`;
																}
																return `${nestedKey}: ${nestedValue}`;
															})
															.join(', ');
													}
													return String(item);
												})
												.join(', ');
											return `${key}: ${arrayErrors}`;
										}
										if (typeof value === 'object' && value !== null) {
											// Manejar estructuras anidadas como { artists: [{ artist: ['error'] }] }
											const nestedErrors = Object.entries(value)
												.map(([nestedKey, nestedValue]) => {
													if (Array.isArray(nestedValue)) {
														return `${nestedKey}: ${nestedValue.join(', ')}`;
													}
													if (
														typeof nestedValue === 'object' &&
														nestedValue !== null
													) {
														return `${nestedKey}: ${Object.values(nestedValue)
															.flat()
															.join(', ')}`;
													}
													return `${nestedKey}: ${nestedValue}`;
												})
												.join(', ');
											return `${key}: ${nestedErrors}`;
										}
										return `${key}: ${value}`;
									})
									.filter(Boolean)
									.join('\n')
							: createResponse.error;
					setError(errorMessage);
					throw new Error(errorMessage || 'Error al crear el lanzamiento');
				}
				const response = await fetch(
					`/api/admin/getAllUsers?page=${currentPage}${
						searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
					}&sort=${sortBy}`
				);
				if (!response.ok) {
					const createResponse = await response.json();
					const errorMessage =
						typeof createResponse.error === 'object'
							? Object.entries(createResponse.error)
									.map(([key, value]) => {
										if (Array.isArray(value)) {
											// Manejar arrays de objetos como artists: [{ artist: ['error'] }]
											const arrayErrors = value
												.map((item, index) => {
													if (typeof item === 'object' && item !== null) {
														return Object.entries(item)
															.map(([nestedKey, nestedValue]) => {
																if (Array.isArray(nestedValue)) {
																	return `${nestedKey}: ${nestedValue.join(
																		', '
																	)}`;
																}
																return `${nestedKey}: ${nestedValue}`;
															})
															.join(', ');
													}
													return String(item);
												})
												.join(', ');
											return `${key}: ${arrayErrors}`;
										}
										if (typeof value === 'object' && value !== null) {
											// Manejar estructuras anidadas como { artists: [{ artist: ['error'] }] }
											const nestedErrors = Object.entries(value)
												.map(([nestedKey, nestedValue]) => {
													if (Array.isArray(nestedValue)) {
														return `${nestedKey}: ${nestedValue.join(', ')}`;
													}
													if (
														typeof nestedValue === 'object' &&
														nestedValue !== null
													) {
														return `${nestedKey}: ${Object.values(nestedValue)
															.flat()
															.join(', ')}`;
													}
													return `${nestedKey}: ${nestedValue}`;
												})
												.join(', ');
											return `${key}: ${nestedErrors}`;
										}
										return `${key}: ${value}`;
									})
									.filter(Boolean)
									.join('\n')
							: createResponse.error;
					setError(errorMessage);
					throw new Error(errorMessage || 'Error al crear el lanzamiento');
				}
				const data = await response.json();
				if (data.success) {
					setUsers(data.data.users);
					setTotalPages(data.data.pagination.totalPages);
					setTotalItems(data.data.pagination.total);
					setShowSelloModal(false);
					setSelectedSello(null);
					toast.success('Sello actualizado correctamente');
				}
			}
		} catch (error) {
			console.error('Error updating sello:', error);
			toast.error(
				error instanceof Error ? error.message : 'Error al actualizar el sello'
			);
		}
	};

	const handleAdminSave = async (updatedAdmin: any) => {
		try {
			const res = await fetch(`/api/admin/updateUser/${updatedAdmin._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedAdmin),
			});
			const data = await res.json();
			if (!res.ok) {
				const errorMessage =
					typeof data.error === 'object'
						? Object.entries(data.error)
								.map(([key, value]) => {
									if (Array.isArray(value)) {
										return `${key}: ${value.join(', ')}`;
									}
									if (typeof value === 'object' && value !== null) {
										return `${key}: ${Object.values(value).join(', ')}`;
									}
									return `${key}: ${value}`;
								})
								.filter(Boolean)
								.join('\n')
						: data.error;
				toast.error(errorMessage);
				return;
			}
			if (data.success) {
				// Mantener los campos originales del usuario y actualizar con los nuevos datos
				setUsers(
					users.map(u => {
						if (u._id === updatedAdmin._id) {
							return {
								...u, // Mantener todos los campos originales
								...updatedAdmin, // Actualizar con los nuevos datos
								role: 'admin', // Asegurar que el rol se mantenga como 'admin'
							};
						}
						return u;
					})
				);
				setShowAdminModal(false);
				setSelectedAdmin(null);
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Error al crear administrador'
			);
		}
	};

	const InviteUserModal = () => {
		const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
		const [password, setPassword] = useState<string>('');
		const [showCopied, setShowCopied] = useState(false);
		const [name, setName] = useState('');
		const [email, setEmail] = useState('');
		const [isLoading, setIsLoading] = useState(false);
		const [error, setError] = useState<string | null>(null);
		const catalogNumRef = useRef<HTMLInputElement>(null);

		const handleRoleChange = (option: RoleOption | null) => {
			setSelectedRole(option);
		};

		const generatePassword = () => {
			const length = 12;
			const charset =
				'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
			let newPassword = '';
			for (let i = 0; i < length; i++) {
				newPassword += charset.charAt(
					Math.floor(Math.random() * charset.length)
				);
			}
			setPassword(newPassword);
		};

		const copyToClipboard = async () => {
			if (password) {
				try {
					await navigator.clipboard.writeText(password);
					setShowCopied(true);
					setTimeout(() => setShowCopied(false), 2000);
				} catch (err) {
					console.error('Error al copiar al portapapeles:', err);
				}
			}
		};

		const handleSubmit = async (e: React.FormEvent) => {
			e.preventDefault();
			setError(null);
			setIsLoading(true);

			try {
				let response;
				let data;

				if (selectedRole?.value === 'sello') {
					const data = {
						name,
						email,
						password,
						role: 'sello',
						catalog_num: catalogNumRef.current?.value,
					};

					response = await fetch('/api/admin/InviteUsuario', {
						method: 'POST',
						body: JSON.stringify(data),
					});
				} else {
					const requestBody: any = {
						name,
						email,
						password,
						role: selectedRole?.value,
					};

					response = await fetch('/api/admin/InviteUsuario', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(requestBody),
					});
				}

				data = await response.json();

				if (!response.ok) {
					if (typeof data.error === 'object' && data.error !== null) {
						const errorMessages = Object.values(data.error).flat();
						throw new Error(errorMessages.join('\n'));
					}
					throw new Error(data.error || 'Error al invitar usuario');
				}

				toast.success('El usuario ha sido invitado');
				setShowInviteModal(false);
				setName('');
				setEmail('');
				setPassword('');
				setSelectedRole(null);
				if (catalogNumRef.current) {
					catalogNumRef.current.value = '';
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Error al invitar usuario';
				if (errorMessage.includes('\n')) {
					errorMessage.split('\n').forEach(msg => {
						toast.error(msg);
					});
				} else {
					toast.error(errorMessage);
				}
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<AnimatePresence>
				{showInviteModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							className="bg-white rounded-lg p-6 w-full max-w-2xl"
						>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold text-gray-800">
									Invitar Usuario
								</h2>
								<button
									onClick={() => setShowInviteModal(false)}
									className="text-gray-500 hover:text-gray-700"
								>
									<X size={24} />
								</button>
							</div>
							<p className="text-sm text-gray-600 mb-6">
								Los datos de acceso serán enviados al correo electrónico
								proporcionado. El usuario podrá acceder al sistema con estas
								credenciales.
							</p>
							<form className="space-y-4" onSubmit={handleSubmit}>
								<div>
									<label
										htmlFor="name"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Nombre
									</label>
									<input
										type="text"
										id="name"
										value={name}
										onChange={e => setName(e.target.value)}
										className="w-full pl-4 pr-4 pt-4 pb-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
										placeholder="Ingrese nombre y apellido"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="email"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Email
										</label>
										<input
											type="email"
											id="email"
											value={email}
											onChange={e => setEmail(e.target.value)}
											className="w-full pl-4 pr-4 pt-4 pb-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
											placeholder="Ingrese el email"
										/>
									</div>
									<div>
										<label
											htmlFor="password"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Contraseña
										</label>
										<div className="relative">
											<input
												type="password"
												id="password"
												value={password}
												onChange={e => setPassword(e.target.value)}
												className="w-full pl-4 pr-32 pt-4 pb-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
												placeholder="Ingrese la contraseña"
											/>
											<div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
												<button
													type="button"
													onClick={generatePassword}
													className="px-2 py-1 text-sm text-brand-light hover:text-brand-dark transition-colors flex items-center gap-1"
												>
													<span className="text-xs">Generar</span>
												</button>
												<button
													type="button"
													onClick={copyToClipboard}
													className="px-2 py-1 text-sm text-brand-light hover:text-brand-dark transition-colors flex items-center gap-1"
													title="Copiar contraseña"
												>
													{showCopied ? (
														<>
															<CheckCircle size={16} />
															<span className="text-xs">Copiado</span>
														</>
													) : (
														<>
															<Copy size={16} />
														</>
													)}
												</button>
											</div>
										</div>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Rol
									</label>
									<Select
										options={roleOptions}
										value={selectedRole}
										onChange={handleRoleChange}
										styles={selectStyles}
										placeholder="Seleccione un rol"
										className="w-full"
									/>
								</div>
								<div
									style={{
										display: selectedRole?.value === 'sello' ? 'block' : 'none',
										height: selectedRole?.value === 'sello' ? 'auto' : '0',
										overflow: 'hidden',
									}}
								>
									<div>
										<label
											htmlFor="catalogNum"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Número de Catálogo (entre -32,768 y 32,767)
										</label>
										<input
											type="number"
											id="catalogNum"
											ref={catalogNumRef}
											className="w-full pl-4 pr-4 pt-4 pb-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
											placeholder="Ingrese el número de catálogo"
											min="-32768"
											max="32767"
										/>
									</div>
								</div>
								{error && (
									<div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
										{error}
									</div>
								)}
								<div className="flex justify-end space-x-3 mt-6">
									<button
										type="button"
										onClick={() => setShowInviteModal(false)}
										className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
										disabled={isLoading}
									>
										Cancelar
									</button>
									<button
										type="submit"
										className="px-4 py-2 text-sm font-medium text-white bg-brand-light rounded-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
										disabled={isLoading}
									>
										{isLoading ? (
											<>
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
												<span>Enviando...</span>
											</>
										) : (
											'Invitar'
										)}
									</button>
								</div>
							</form>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		);
	};

	return (
		<div className="min-h-screen w-full bg-white px-4 py- sm:px-6 md:px-8">
			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 left-4 sm:left-auto sm:right-4 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 backdrop-blur-sm"
				>
					<CheckCircle className="h-5 w-5" />
					<span>
						{deletedUserName
							? `Usuario "${deletedUserName}" eliminado correctamente`
							: 'Usuario actualizado correctamente'}
					</span>
				</motion.div>
			)}

			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
						<SearchInput
							value={searchQuery}
							onChange={setSearchQuery}
							className=""
							placeholder="Buscar por nombre..."
						/>

						<RoleFilter
							value={selectedRole}
							onChange={option => {
								setSelectedRole(option);
								// Opcional: recargar los usuarios cuando cambie el filtro
								// fetchUsers();
							}}
							className="w-48"
						/>
						<SortSelect
							value={sortBy}
							onChange={setSortBy}
							options={[
								{ value: 'newest', label: 'Más recientes' },
								{ value: 'oldest', label: 'Más antiguos' },
							]}
							className="md:ml-8"
						/>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setShowInviteModal(true)}
							className="p-2.5 flex items-center text-brand-light rounded-lg transition-colors group hover:bg-gray-100"
						>
							<Mail
								className="mr-2 text-brand-light hover:text-brand-dark"
								size={18}
							/>
							Invitar
						</motion.button>
						<Link
							href="/panel/crearUsuario"
							className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-white text-brand-light hover:text-white hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
						>
							<Plus className="h-4 w-4 mr-1.5" />
							Crear
						</Link>
					</div>
				</div>

				<div className="bg-white shadow-sm rounded-lg overflow-hidden">
					<div className="overflow-x-auto -mx-4 sm:mx-0">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th
										scope="col"
										className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Nombre
									</th>
									<th
										scope="col"
										className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Email
									</th>
									<th
										scope="col"
										className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Rol
									</th>
									<th
										scope="col"
										className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Estado
									</th>
									<th
										scope="col"
										className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Acciones
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{users.map(user => (
									<tr key={user._id} className="hover:bg-gray-50">
										<td className="px-4 sm:px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
													{user.picture ? (
														<img
															src={
																typeof user.picture === 'string'
																	? user.picture.startsWith('data:')
																		? user.picture
																		: user.picture.startsWith('http')
																		? user.picture
																		: `data:image/jpeg;base64,${user.picture}`
																	: ''
															}
															alt={user.name}
															className="h-full w-full object-cover"
														/>
													) : (
														<div className="h-full w-full bg-gray-200 flex items-center justify-center">
															<span className="text-gray-500 text-lg">
																{user.name.charAt(0)}
															</span>
														</div>
													)}
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900">
														{user.name}
													</div>
												</div>
											</div>
										</td>
										<td className="px-4 sm:px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">{user.email}</div>
										</td>
										<td className="px-4 sm:px-6 py-4 whitespace-nowrap">
											<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
												{user.role}
											</span>
										</td>
										<td className="px-4 sm:px-6 py-4 whitespace-nowrap">
											<span
												className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
													user.status === 'activo'
														? 'bg-green-100 text-green-800'
														: user.status === 'inactivo'
														? 'bg-gray-100 text-gray-400'
														: 'bg-red-100 text-red-800'
												}`}
											>
												{user.status || 'inactivo'}
											</span>
										</td>
										<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<div className="flex items-center justify-end space-x-2">
												<motion.button
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													onClick={() => handleEdit(user)}
													className="p-2.5 flex items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
												>
													<Pencil
														className="text-brand-light hover:text-brand-dark"
														size={18}
													/>
												</motion.button>
												<motion.button
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													onClick={() => handleDeleteClick(user)}
													className="p-2.5 flex items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
												>
													<Trash2
														className="text-red-500 hover:text-red-700"
														size={18}
													/>
												</motion.button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalItems={totalItems}
					itemsPerPage={10}
					onPageChange={setCurrentPage}
					className="mt-4"
				/>
			</div>

			{showArtistModal && selectedArtist && (
				<>
					<UpdateArtistaModal
						artista={{
							_id: selectedArtist._id,
							name: selectedArtist.name,
							email: selectedArtist.email,
							role: 'artista',
							status: (selectedArtist.status || 'activo') as
								| 'activo'
								| 'inactivo'
								| 'banneado',
							external_id: selectedArtist.external_id
								? Number(selectedArtist.external_id)
								: undefined,
							picture: selectedArtist.picture,
							isMainAccount: selectedArtist.isMainAccount || false,
							createdAt: new Date(),
							updatedAt: new Date(),
							amazon_music_identifier: selectedArtist.amazon_music_identifier,
							apple_identifier: selectedArtist.apple_identifier,
							deezer_identifier: selectedArtist.deezer_identifier,
							spotify_identifier: selectedArtist.spotify_identifier,
						}}
						err={error}
						isOpen={showArtistModal}
						onClose={() => {
							setShowArtistModal(false);
							setSelectedArtist(null);
						}}
						onSave={handleArtistSave}
					/>
				</>
			)}

			{showSelloModal && selectedSello && (
				<>
					<UpdateSelloModal
						sello={selectedSello as any}
						isOpen={showSelloModal}
						onClose={() => {
							setShowSelloModal(false);
							setSelectedSello(null);
						}}
						onSave={handleSelloSave}
					/>
				</>
			)}

			{showAdminModal && selectedAdmin && (
				<>
					<UpdateAdminModal
						admin={selectedAdmin}
						isOpen={showAdminModal}
						onClose={() => {
							setShowAdminModal(false);
							setSelectedAdmin(null);
						}}
						onSave={handleAdminSave}
					/>
				</>
			)}

			{showContributorModal && selectedContributor && (
				<>
					<UpdateContributorModal
						contributor={{
							id: selectedContributor._id,
							external_id: selectedContributor.external_id
								? Number(selectedContributor.external_id)
								: 0,
							name: selectedContributor.name,
							email: selectedContributor.email,
							status:
								selectedContributor.status === 'inactivo' ||
								selectedContributor.status === 'banneado'
									? selectedContributor.status
									: 'activo',
						}}
						onUpdate={handleContributorUpdate}
						isOpen={showContributorModal}
						onClose={() => {
							setShowContributorModal(false);
							setSelectedContributor(null);
						}}
					/>
				</>
			)}

			{showPublisherModal && selectedPublisher && (
				<>
					<UpdatePublisherModal
						publisher={{
							_id: selectedPublisher._id,
							name: selectedPublisher.name,
							email: selectedPublisher.email,
							external_id: selectedPublisher.external_id
								? Number(selectedPublisher.external_id)
								: 0,
							role: selectedPublisher.role,
							status: selectedPublisher.status || 'activo',
							picture: selectedPublisher.picture,
						}}
						onUpdate={handlePublisherUpdate}
						isOpen={showPublisherModal}
						onClose={() => {
							setShowPublisherModal(false);
							setSelectedPublisher(null);
						}}
					/>
				</>
			)}

			<AnimatePresence>
				{showDeleteModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
						onClick={() => !isDeleting && setShowDeleteModal(false)}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={{ type: 'spring', damping: 25, stiffness: 300 }}
							className="bg-white rounded-xl shadow-xl w-full max-w-md"
							onClick={e => e.stopPropagation()}
						>
							<div className="p-6 border-b border-gray-200 flex justify-between items-center">
								<h2 className="text-xl font-semibold text-gray-800">
									Confirmar Eliminación
								</h2>
								<button
									onClick={() => !isDeleting && setShowDeleteModal(false)}
									className="p-1 rounded-full hover:bg-gray-100 transition-colors"
									disabled={isDeleting}
								>
									<X size={20} className="text-gray-500" />
								</button>
							</div>

							<div className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<AlertTriangle className="h-6 w-6 text-red-500" />
									<p className="text-gray-700">
										¿Estás seguro de que deseas eliminar al usuario{' '}
										<span className="font-semibold">{userToDelete?.name}</span>?
									</p>
								</div>
								<p className="text-sm text-gray-500 mb-6">
									Esta acción no se puede deshacer. Todos los datos asociados a
									este usuario serán eliminados permanentemente.
								</p>

								{deleteError && (
									<div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
										{deleteError}
									</div>
								)}

								<div className="flex justify-end space-x-3">
									<button
										onClick={() => !isDeleting && setShowDeleteModal(false)}
										className="px-4 py-2 rounded-md text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={isDeleting}
									>
										Cancelar
									</button>
									<button
										onClick={handleConfirmDelete}
										className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
										disabled={isDeleting}
									>
										{isDeleting ? (
											<>
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
												<span>Eliminando...</span>
											</>
										) : (
											'Eliminar'
										)}
									</button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<InviteUserModal />
		</div>
	);
}
