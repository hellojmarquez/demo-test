'use client';

import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

interface User {
	_id: string;
	name: string;
	email: string;
	role: string;
	picture?: string;
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

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold text-blue-700">Gestión de Usuarios</h2>

			<div className="overflow-auto max-h-[60vh] border rounded shadow">
				<div className="flex justify-end pb-4">
					<Link
						href="/sello/crearUsuario"
						className="bg-green-500 py-2 px-4 rounded-lg text-white hover:bg-green-600 transition-colors"
					>
						Crear usuario
					</Link>
				</div>
				<table className="min-w-full text-sm text-gray-800">
					<thead className="sticky top-0 bg-blue-600 text-white z-10">
						<tr>
							<th className="px-4 py-3 text-left">Nombre</th>
							<th className="px-4 py-3 text-left">Email</th>
							<th className="px-4 py-3 text-left">Rol</th>
							<th className="px-4 py-3 text-right">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{users.map(user => (
							<tr
								key={user._id}
								className="hover:bg-blue-50 border-b transition-all"
							>
								<td className="px-4 py-2">{user.name}</td>
								<td className="px-4 py-2">{user.email}</td>
								<td className="px-4 py-2 capitalize">{user.role}</td>
								<td className="px-4 py-2 text-right">
									<button
										onClick={() => handleEdit(user)}
										className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
									>
										<Pencil className="w-4 h-4" />
										Editar
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
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

							return null; // Para mantenerlo simple, sin arrays u objetos aquí
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
