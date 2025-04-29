'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface User {
	_id: string;
	name: string;
	email: string;
	role: string;
	picture?: { base64: string };
	status?: string;
	lastConnection?: string;
	lastConnectionIP?: string;
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
		setEditingUserId(user._id);
		setEditedUser({ ...user });
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

			{editedUser && (
				<div className="border p-6 rounded-md bg-white shadow space-y-4">
					<h3 className="text-xl font-semibold text-blue-700">
						Editar Usuario
					</h3>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{Object.entries(editedUser).map(([key, value]) => {
							if (['_id', 'createdAt', 'updatedAt', '__v'].includes(key))
								return null;

							if (typeof value === 'string' || typeof value === 'number') {
								return (
									<div key={key}>
										<label className="block text-sm font-medium text-gray-600 capitalize">
											{key}
										</label>
										<input
											className="w-full border px-3 py-2 rounded-md text-sm"
											value={value}
											onChange={e => handleChange(key, e.target.value)}
										/>
									</div>
								);
							}

							if (typeof value === 'boolean') {
								return (
									<div key={key} className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={value}
											onChange={e => handleChange(key, e.target.checked)}
										/>
										<label className="text-sm text-gray-600">{key}</label>
									</div>
								);
							}

							return null;
						})}
					</div>

					<div className="flex gap-4 pt-4">
						<button
							onClick={handleSave}
							className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
						>
							Guardar
						</button>
						<button
							onClick={handleCancel}
							className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
						>
							Cancelar
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
