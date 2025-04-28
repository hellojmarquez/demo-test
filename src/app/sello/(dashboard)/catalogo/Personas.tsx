import React, { useEffect, useState } from 'react';
import { User, Pencil, Trash2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import UpdateUserModal from '@/components/updateUserModal';

interface Persona {
	_id: string;
	name: string;
	email: string;
	picture?: {
		base64: string;
	};
	role: string;
	status: string;
}

const Personas = () => {
	const [personas, setPersonas] = useState<Persona[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [selectedUser, setSelectedUser] = useState<Persona | null>(null);
	const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);

	useEffect(() => {
		fetchPersonas();
	}, []);

	const fetchPersonas = async () => {
		try {
			const res = await fetch('/api/admin/getAllArtists');
			const r = await res.json();
			if (r.success) {
				console.log(r.data);
				setPersonas(r.data);
			}
			setIsLoading(false);
		} catch (error) {
			console.error('Error fetching personas:', error);
			setIsLoading(false);
		}
	};

	const handleDelete = async (e: React.MouseEvent, persona: Persona) => {
		e.stopPropagation();
		if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
			setIsDeleting(persona._id);
			try {
				const response = await fetch(`/api/admin/deleteUser/${persona._id}`, {
					method: 'DELETE',
				});
				if (response.ok) {
					setPersonas(personas.filter(p => p._id !== persona._id));
					setShowSuccessMessage(true);
					setTimeout(() => setShowSuccessMessage(false), 3000);
				}
			} catch (error) {
				console.error('Error deleting persona:', error);
			} finally {
				setIsDeleting(null);
			}
		}
	};

	const handleEdit = (e: React.MouseEvent, persona: Persona) => {
		e.stopPropagation();
		setSelectedUser(persona);
		setIsUpdateModalOpen(true);
	};

	const handleUpdate = async (updatedUser: Persona) => {
		try {
			// Obtener los datos actualizados del usuario
			const response = await fetch(`/api/admin/getAllArtists`);
			const data = await response.json();
			if (data.success) {
				setPersonas(data.data);
				setShowSuccessMessage(true);
				setTimeout(() => setShowSuccessMessage(false), 3000);
			}
		} catch (error) {
			console.error('Error refreshing personas:', error);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-dark"></div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-gray-800">Personas</h1>
				<button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-brand-light hover:text-white transition-all duration-200 shadow-sm group">
					<Plus size={18} className="text-brand-light group-hover:text-white" />
					<span className="font-medium">Agregar Persona</span>
				</button>
			</div>

			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2"
				>
					<span>Operación exitosa</span>
				</motion.div>
			)}

			<div className="bg-white shadow-md rounded-lg overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Usuario
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Email
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Rol
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Estado
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{personas.map(persona => (
							<tr key={persona._id} className="hover:bg-gray-50">
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="flex items-center">
										<div className="flex-shrink-0 h-10 w-10">
											{persona.picture?.base64 ? (
												<motion.img
													whileHover={{ scale: 1.05 }}
													transition={{ duration: 0.2 }}
													src={`data:image/jpeg;base64,${persona.picture.base64}`}
													alt={persona.name}
													className="h-10 w-10 rounded-full object-cover"
												/>
											) : (
												<div className="h-10 w-10 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-full">
													<User className="h-6 w-6 text-gray-400" />
												</div>
											)}
										</div>
										<div className="ml-4">
											<div className="text-sm font-medium text-gray-900">
												{persona.name}
											</div>
										</div>
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-900">{persona.email}</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
										{persona.role}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
											persona.status === 'active'
												? 'bg-green-100 text-green-800'
												: 'bg-red-100 text-red-800'
										}`}
									>
										{persona.status}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<div className="flex items-center space-x-2">
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={e => handleEdit(e, persona)}
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
											onClick={e => handleDelete(e, persona)}
											disabled={isDeleting === persona._id}
											className="p-2.5 flex items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
										>
											{isDeleting === persona._id ? (
												<div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
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
		</div>
	);
};

export default Personas;
