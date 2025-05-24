'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, XCircle, AlertTriangle } from 'lucide-react';
import Select from 'react-select';

interface UpdateContributorModalProps {
	contributor: {
		id: string;
		external_id: number;
		name: string;
		email: string;
		status: 'active' | 'inactive' | 'banned';
	};
	onUpdate: (data: {
		name: string;
		email: string;
		status: string;
		password: string;
	}) => void;
	isOpen: boolean;
	onClose: () => void;
}

export function UpdateContributorModal({
	contributor,
	onUpdate,
	isOpen,
	onClose,
}: UpdateContributorModalProps) {
	const [name, setName] = useState(contributor.name);
	const [email, setEmail] = useState(contributor.email);
	const [status, setStatus] = useState(contributor.status);
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

	const statusOptions = [
		{ value: 'active', label: 'Activo' },
		{ value: 'inactive', label: 'Inactivo' },
		{ value: 'banned', label: 'Banneado' },
	];

	const customStyles = {
		control: (base: any) => ({
			...base,
			border: 'none',
			borderBottom: '2px solid #E5E7EB',
			borderRadius: '0',
			boxShadow: 'none',
			backgroundColor: 'transparent',
			'&:hover': {
				borderBottom: '2px solid #4B5563',
			},
		}),
		option: (base: any, state: { isSelected: boolean }) => ({
			...base,
			backgroundColor: state.isSelected ? '#E5E7EB' : 'white',
			color: '#1F2937',
			'&:hover': {
				backgroundColor: '#F3F4F6',
			},
		}),
		singleValue: (base: any) => ({
			...base,
			color: '#1F2937',
		}),
	};

	// Actualizar el nombre, email y estado cuando cambia el contribuidor
	useEffect(() => {
		setName(contributor.name);
		setEmail(contributor.email);
		setStatus(contributor.status);
	}, [contributor]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch(
				`/api/admin/updateContributor/${contributor.external_id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						name,
						email,
						status,
						password,
					}),
				}
			);

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Error al actualizar el contribuidor');
			}

			onUpdate({ name, email, status, password });
			onClose();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'Error al actualizar el contribuidor'
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
						onClick={e => e.stopPropagation()}
					>
						<div className="p-6 border-b border-gray-200 flex justify-between items-center">
							<h2 className="text-xl font-semibold text-gray-800">
								Editar Contribuidor
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6">
							{error && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
									{error}
								</div>
							)}

							<div className="space-y-4">
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
										name="name"
										value={name}
										onChange={e => setName(e.target.value)}
										className={inputStyles}
										required
										disabled={isLoading}
									/>
								</div>
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
										name="email"
										value={email}
										onChange={e => setEmail(e.target.value)}
										className={inputStyles}
										required
										disabled={isLoading}
									/>
								</div>
								<div>
									<label
										htmlFor="password"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Contraseña
									</label>
									<input
										type="password"
										id="password"
										name="password"
										value={password}
										onChange={e => setPassword(e.target.value)}
										className={inputStyles}
										placeholder="Dejar en blanco para mantener la contraseña actual"
										disabled={isLoading}
									/>
								</div>
								<div>
									<label
										htmlFor="status"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Estado
									</label>
									<Select
										id="status"
										value={statusOptions.find(
											option => option.value === status
										)}
										onChange={option =>
											setStatus(
												option?.value as 'active' | 'inactive' | 'banned'
											)
										}
										options={statusOptions}
										styles={customStyles}
										isSearchable={false}
										placeholder="Seleccionar estado"
										isDisabled={isLoading}
									/>
									{status === 'banned' && (
										<div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
											<AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
											<p className="text-sm text-red-700">
												Si realiza esa acción este usuario{' '}
												<span className="font-semibold">
													no podrá acceder al sitio web
												</span>
											</p>
										</div>
									)}
								</div>
							</div>

							<div className="mt-6 flex justify-end space-x-3">
								<button
									type="button"
									onClick={onClose}
									disabled={isLoading}
									className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
									<span className="group-hover:text-brand-dark">Cancelar</span>
								</button>
								<button
									type="submit"
									disabled={isLoading}
									className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
											<span>Actualizando...</span>
										</>
									) : (
										<>
											<Save className="h-4 w-4 group-hover:text-brand-dark" />
											<span className="group-hover:text-brand-dark">
												Actualizar
											</span>
										</>
									)}
								</button>
							</div>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
