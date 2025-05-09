'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import UpdateArtistaModal from '@/components/updateArtistaModal';
import UpdateSelloModal from '@/components/UpdateSelloModal';
import UpdateAdminModal from '@/components/UpdateAdminModal';
import { UpdateContributorModal } from '@/components/UpdateContributorModal';
import { UpdatePublisherModal } from '@/components/UpdatePublisherModal';

interface User {
	_id: string;
	name: string;
	email: string;
	role: string;
	picture?: { base64: string };
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

export default function UsuariosPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [editedUser, setEditedUser] = useState<User | null>(null);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
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

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const res = await fetch('/api/admin/getAllUsers');
				const data = await res.json();
				if (data.success) {
					console.log(data.users);
					setUsers(data.users);
				}
			} catch (error) {
				console.error('Error fetching users:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchUsers();
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-dark"></div>
			</div>
		);
	}

	const handleEdit = (user: User) => {
		console.log('Rol del usuario:', user.role);

		// Verificar si el rol es "artist" o "artista" (ignorando mayúsculas/minúsculas)
		if (
			user.role &&
			(user.role.toLowerCase() === 'artist' ||
				user.role.toLowerCase() === 'artista')
		) {
			console.log('Es un artista, abriendo modal de artista');
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
			console.log('Es un sello, abriendo modal de sello');
			// Adaptar los datos del usuario al formato esperado por UpdateSelloModal
			const adaptedSelloData = {
				_id: user._id,
				name: user.name,
				picture: user.picture || { base64: '' },
				catalog_num: user.catalog_num || 0,
				year: user.year || 0,
				status: user.status || 'active',
				contract_received: user.contract_received || false,
				information_accepted: user.information_accepted || false,
				label_approved: user.label_approved || false,
				assigned_artists: user.assigned_artists || [],
				createdAt: user.createdAt || new Date().toISOString(),
				updatedAt: user.updatedAt || new Date().toISOString(),
			};
			// Usar any para evitar problemas de tipo
			setSelectedSello(adaptedSelloData as any);
			setShowSelloModal(true);
		}
		// Verificar si el rol es "admin"
		else if (user.role && user.role.toLowerCase() === 'admin') {
			console.log('Es un administrador, abriendo modal de admin');
			setSelectedAdmin(user);
			setShowAdminModal(true);
		}
		// Verificar si el rol es "contributor"
		else if (user.role && user.role.toLowerCase() === 'contributor') {
			console.log('Es un contribuidor, abriendo modal de contribuidor');
			setSelectedContributor(user);
			setShowContributorModal(true);
		}
		// Verificar si el rol es "publisher"
		else if (user.role && user.role.toLowerCase() === 'publisher') {
			console.log('Es un publisher, abriendo modal de publisher');
			setSelectedPublisher(user);
			setShowPublisherModal(true);
		} else {
			console.log(
				'No es un artista, sello, admin, contribuidor ni publisher, usando edición normal'
			);
			setEditingUserId(user._id);
			setEditedUser({ ...user });
		}
	};

	const handleCancel = () => {
		setEditingUserId(null);
		setEditedUser(null);
	};

	const handleDelete = async (e: React.MouseEvent, user: User) => {
		e.stopPropagation();

		if (!confirm(`¿Estás seguro de que deseas eliminar "${user.name}"?`)) {
			return;
		}

		setIsDeleting(user._id);

		try {
			const response = await fetch(`/api/admin/deleteUser/${user._id}`, {
				method: 'DELETE',
			});

			const data = await response.json();

			if (response.ok) {
				setUsers(prev => prev.filter(u => u._id !== user._id));
			} else {
				alert(data.message || 'Error al eliminar el usuario');
			}
		} catch (error) {
			console.error('Error deleting user:', error);
			alert('Error al eliminar el usuario');
		} finally {
			setIsDeleting(null);
		}
	};

	const handleContributorUpdate = () => {
		// Recargar la lista de usuarios después de actualizar un contribuidor
		const fetchUsers = async () => {
			const res = await fetch('/api/admin/getAllUsers');
			const data = await res.json();
			if (data.success) {
				setUsers(data.users);
			}
		};
		fetchUsers();
	};

	const handlePublisherUpdate = () => {
		// Recargar la lista de usuarios después de actualizar un publisher
		const fetchUsers = async () => {
			const res = await fetch('/api/admin/getAllUsers');
			const data = await res.json();
			if (data.success) {
				setUsers(data.users);
			}
		};
		fetchUsers();
	};

	const handleArtistSave = async (updatedArtist: any) => {
		try {
			// Asegurarse de que el artista tenga el rol 'artista'
			const artistToSave = {
				...updatedArtist,
				role: 'artista',
			};

			console.log('Updating artista with data:', {
				external_id: artistToSave.external_id,
				_id: artistToSave._id,
			});

			// Verificar que tenemos un external_id válido
			if (!artistToSave.external_id) {
				throw new Error('No se encontró el external_id del artista');
			}

			const res = await fetch(
				`/api/admin/updateArtist/${artistToSave.external_id}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(artistToSave),
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Error al actualizar el artista');
			}

			const data = await res.json();
			if (data.success) {
				setUsers(
					users.map(u => (u._id === artistToSave._id ? artistToSave : u))
				);
				setShowArtistModal(false);
				setSelectedArtist(null);
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

	const handleSelloSave = async (updatedSello: any) => {
		try {
			const res = await fetch(`/api/admin/updateUser/${updatedSello._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedSello),
			});
			const data = await res.json();
			if (data.success) {
				// Mantener los campos originales del usuario y actualizar con los nuevos datos
				setUsers(
					users.map(u => {
						if (u._id === updatedSello._id) {
							return {
								...u, // Mantener todos los campos originales
								...updatedSello, // Actualizar con los nuevos datos
								role: 'sello', // Asegurar que el rol se mantenga como 'sello'
							};
						}
						return u;
					})
				);
				setShowSelloModal(false);
				setSelectedSello(null);
			}
		} catch (error) {
			console.error('Error updating sello:', error);
			alert('Error al actualizar el sello');
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
			console.error('Error updating admin:', error);
			alert('Error al actualizar el administrador');
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-blue-700">
					Gestión de Usuarios
				</h2>
				<div className="flex space-x-2">
					<Link
						href="/sello/crearUsuario"
						className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-brand-light hover:text-white transition-all duration-200 shadow-sm group"
					>
						<Plus
							size={18}
							className="text-brand-light group-hover:text-white"
						/>
						<span className="font-medium">Crear usuario</span>
					</Link>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Usuario
								</th>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Email
								</th>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Rol
								</th>
								<th
									scope="col"
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Estado
								</th>
								<th
									scope="col"
									className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									Acciones
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{users.map(user => (
								<tr key={user._id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center">
											<div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
												{user.picture?.base64 ? (
													<img
														src={`data:image/jpeg;base64,${user.picture.base64}`}
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
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900">{user.email}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
											{user.role}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
												user.status === 'active'
													? 'bg-green-100 text-green-800'
													: 'bg-red-100 text-red-800'
											}`}
										>
											{user.status || 'inactive'}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
												onClick={e => handleDelete(e, user)}
												disabled={isDeleting === user._id}
												className="p-2.5 flex items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
											>
												{isDeleting === user._id ? (
													<div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
												) : (
													<Trash2
														className="text-red-500 hover:text-red-700"
														size={18}
													/>
												)}
											</motion.button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{showArtistModal && selectedArtist && (
				<>
					{console.log('Renderizando modal de artista')}
					<UpdateArtistaModal
						artista={selectedArtist}
						isOpen={showArtistModal}
						onClose={() => {
							console.log('Cerrando modal de artista');
							setShowArtistModal(false);
							setSelectedArtist(null);
						}}
						onSave={handleArtistSave}
					/>
				</>
			)}

			{showSelloModal && selectedSello && (
				<>
					{console.log('Renderizando modal de sello')}
					<UpdateSelloModal
						sello={selectedSello as any}
						isOpen={showSelloModal}
						onClose={() => {
							console.log('Cerrando modal de sello');
							setShowSelloModal(false);
							setSelectedSello(null);
						}}
						onSave={handleSelloSave}
					/>
				</>
			)}

			{showAdminModal && selectedAdmin && (
				<>
					{console.log('Renderizando modal de admin')}
					<UpdateAdminModal
						admin={selectedAdmin}
						isOpen={showAdminModal}
						onClose={() => {
							console.log('Cerrando modal de admin');
							setShowAdminModal(false);
							setSelectedAdmin(null);
						}}
						onSave={handleAdminSave}
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

			{showPublisherModal && selectedPublisher && (
				<>
					{console.log('Renderizando modal de publisher')}
					<UpdatePublisherModal
						publisher={{
							id: selectedPublisher._id,
							external_id: selectedPublisher.external_id
								? Number(selectedPublisher.external_id)
								: 0,
							name: selectedPublisher.name,
						}}
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
		</div>
	);
}
