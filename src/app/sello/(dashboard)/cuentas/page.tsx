'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import UpdateArtistaModal from '@/components/updateArtistaModal';

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
	[key: string]: any;
}

export default function UsuariosPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [editedUser, setEditedUser] = useState<User | null>(null);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [showArtistModal, setShowArtistModal] = useState(false);
	const [selectedArtist, setSelectedArtist] = useState<User | null>(null);

	useEffect(() => {
		const fetchUsers = async () => {
			const res = await fetch('/api/admin/getAllUsers');
			const data = await res.json();
			if (data.success) {
				console.log(data.users);
				setUsers(data.users);
			}
		};
		fetchUsers();
	}, []);

	const handleEdit = (user: User) => {
		console.log('Editando usuario:', user);
		console.log('Rol del usuario:', user.role);

		// Verificar si el rol es "artist" o "artista" (ignorando mayúsculas/minúsculas)
		if (
			user.role &&
			(user.role.toLowerCase() === 'artist' ||
				user.role.toLowerCase() === 'artista')
		) {
			console.log('Es un artista, abriendo modal de artista');
			setSelectedArtist(user);
			setShowArtistModal(true);
		} else {
			console.log('No es un artista, usando edición normal');
			setEditingUserId(user._id);
			setEditedUser({ ...user });
		}
	};

	const handleCancel = () => {
		setEditingUserId(null);
		setEditedUser(null);
	};

	const handleChange = (key: string, value: any) => {
		if (!editedUser) return;
		setEditedUser({ ...editedUser, [key]: value });
	};

	const handleSave = async () => {
		if (!editedUser) return;
		const res = await fetch(`/api/admin/updateUser/${editedUser._id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(editedUser),
		});
		const data = await res.json();
		if (data.success) {
			setUsers(users.map(u => (u._id === editedUser._id ? editedUser : u)));
			handleCancel();
		}
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

	const handleArtistSave = async (updatedArtist: any) => {
		try {
			// Asegurarse de que el artista tenga el rol 'artist'
			const artistToSave = {
				...updatedArtist,
				role: 'artist',
			};

			const res = await fetch(`/api/admin/updateUser/${artistToSave._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(artistToSave),
			});
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
			alert('Error al actualizar el artista');
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-blue-700">
					Gestión de Usuarios
				</h2>
				<Link
					href="/sello/crearUsuario"
					className="bg-green-500 py-2 px-4 rounded-lg text-white hover:bg-green-600 transition-colors"
				>
					Crear usuario
				</Link>
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
		</div>
	);
}
