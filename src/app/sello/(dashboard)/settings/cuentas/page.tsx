'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/context/SettingsContext';
import { User, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SubAccount {
	_id: string;
	name: string;
	email: string;
	role: string;
	status: string;
	picture: string;
}

const getImageSource = (picture: string | null | undefined) => {
	if (!picture) return null;

	// Si es una URL (comienza con http:// o https://)
	if (picture.startsWith('http://') || picture.startsWith('https://')) {
		return picture;
	}

	if (picture.startsWith('data:image')) {
		return picture;
	}

	// Si es un string base64 sin el prefijo
	return `data:image/jpeg;base64,${picture}`;
};

const Cuentas = () => {
	const { userData } = useSettings();
	const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);

	useEffect(() => {
		const fetchSubAccounts = async () => {
			if (!userData?._id) return;

			try {
				const response = await fetch(
					`/api/admin/getUserRelations/${userData._id}`
				);
				if (!response.ok) {
					throw new Error('Error al obtener las subcuentas');
				}
				const data = await response.json();
				setSubAccounts(data.data.subAccounts || []);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : 'Error al cargar las subcuentas'
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSubAccounts();
	}, [userData?._id]);

	const handleDeleteRelationship = async (subAccountId: string) => {
		if (!userData?._id) return;

		try {
			setIsDeleting(subAccountId);
			const response = await fetch('/api/admin/accountRelationships', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					mainAccountId: userData._id,
					subAccountId: subAccountId,
				}),
			});

			if (!response.ok) {
				throw new Error('Error al eliminar la relación');
			}

			setSubAccounts(prev =>
				prev.filter(account => account._id !== subAccountId)
			);
			toast.success('Relación eliminada exitosamente');
		} catch (error) {
			console.error('Error al eliminar la relación:', error);
			toast.error('Error al eliminar la relación');
		} finally {
			setIsDeleting(null);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<div className="text-red-500 mb-4">Error: {error}</div>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ scale: 0.9, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			exit={{ scale: 0.9, opacity: 0 }}
			transition={{ type: 'spring', damping: 25, stiffness: 300 }}
			className="bg-white mx-auto w-full max-w-[70%]"
		>
			<div className="p-6">
				<h2 className="text-2xl text-center font-bold mb-6">Subcuentas</h2>

				{subAccounts.length === 0 ? (
					<div className="text-center py-8">
						<User className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">
							No hay subcuentas
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							No tienes ninguna subcuenta asociada a tu cuenta principal.
						</p>
					</div>
				) : (
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
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Acciones
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{subAccounts.map(account => (
									<tr key={account._id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10">
													{account.picture ? (
														<img
															src={getImageSource(account.picture) || ''}
															alt={account.name}
															className="h-10 w-10 rounded-full object-cover"
														/>
													) : (
														<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
															<User className="h-6 w-6 text-gray-400" />
														</div>
													)}
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900">
														{account.name}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">
												{account.email}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
												{account.role}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
													account.status === 'activo'
														? 'bg-green-100 text-green-800'
														: account.status === 'inactivo'
														? 'bg-gray-100 text-gray-800'
														: 'bg-red-100 text-red-800'
												}`}
											>
												{account.status}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<button
												onClick={() => handleDeleteRelationship(account._id)}
												disabled={isDeleting === account._id}
												className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
											>
												{isDeleting === account._id
													? 'Desvinculando...'
													: 'Desvincular'}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</motion.div>
	);
};

export default Cuentas;
