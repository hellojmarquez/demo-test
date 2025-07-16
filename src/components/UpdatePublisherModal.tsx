'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
	X,
	Save,
	XCircle,
	AlertTriangle,
	User,
	Mail,
	UserRoundCheck,
	Lock,
} from 'lucide-react';
import Select from 'react-select';

interface UpdatePublisherModalProps {
	publisher: {
		_id: string;
		name: string;
		email: string;
		external_id?: string | number;
		role: string;
		status: string;
		picture?: string;
	};
	onUpdate: (data: {
		name: string;
		email: string;
		status: string;
		password?: string;
	}) => void;
	isOpen: boolean;
	onClose: () => void;
}

const statusOptions = [
	{ value: 'activo', label: 'Activo' },
	{ value: 'inactivo', label: 'Inactivo' },
	{ value: 'banneado', label: 'Banneado' },
];

export const UpdatePublisherModal: React.FC<UpdatePublisherModalProps> = ({
	publisher,
	onUpdate,
	isOpen,
	onClose,
}) => {
	const [formData, setFormData] = useState({
		name: publisher.name,
		email: publisher.email || '',
		password: '',
		status: publisher.status,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nameError, setNameError] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<string | null>(null);

	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

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

	useEffect(() => {
		setFormData(prev => ({
			...prev,
			name: publisher.name,
			email: publisher.email || '',
			password: '',
			status: publisher.status,
		}));
	}, [publisher]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setNameError(null);
		setEmailError(null);
		setError(null);
		let hasError = false;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
		if (!formData.name.trim() || !nameRegex.test(formData.name)) {
			setNameError(
				'El nombre es requerido y no debe tener caracteres especiales ni números'
			);
			hasError = true;
		}

		if (!formData.email.trim() || !emailRegex.test(formData.email)) {
			setEmailError('El email es requerido y el formato debe ser correcto');
			hasError = true;
		}
		if (hasError) {
			setError('Por favor, corrige los errores en el formulario');
			setIsLoading(false);
			return;
		}
		try {
			if (!publisher.external_id) {
				throw new Error('No se encontró el ID del publisher');
			}

			// Validar campos requeridos
			if (!formData.name.trim()) {
				throw new Error('El nombre es requerido');
			}
			if (!formData.email.trim()) {
				throw new Error('El email es requerido');
			}

			// Validar formato de email
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(formData.email)) {
				throw new Error('El formato del email no es válido');
			}

			const response = await fetch(
				`/api/admin/updatePublisher/${publisher.external_id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						name: formData.name.trim(),
						email: formData.email.trim(),
						status: formData.status,
						...(formData.password && { password: formData.password }),
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
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
				setError(errorMessage);
				return;
			}

			toast.success('Publisher actualizado con éxito');
			onUpdate({
				name: formData.name.trim(),
				email: formData.email.trim(),
				status: formData.status,
				...(formData.password && { password: formData.password }),
			});
			onClose();
		} catch (error) {
			console.error('Error updating publisher:', error);
			setError(
				error instanceof Error
					? error.message
					: 'Error al actualizar el publisher'
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
								Editar Publisher
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
									<div className="relative">
										<User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
										<input
											type="text"
											id="name"
											name="name"
											value={formData.name}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											required
											disabled={isLoading}
										/>
									</div>
								</div>

								<div>
									<label
										htmlFor="email"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Email
									</label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
										<input
											type="email"
											id="email"
											name="email"
											value={formData.email}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											required
											disabled={isLoading}
										/>
									</div>
								</div>

								<div>
									<label
										htmlFor="password"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Contraseña (opcional)
									</label>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
										<input
											type="password"
											id="password"
											name="password"
											value={formData.password}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											placeholder="Dejar en blanco para mantener la contraseña actual"
											disabled={isLoading}
										/>
									</div>
								</div>

								<div>
									<label
										htmlFor="status"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Estado
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<UserRoundCheck className="h-5 w-5 text-gray-400" />
										</div>
										<Select
											id="status"
											value={statusOptions.find(
												option => option.value === formData.status
											)}
											onChange={option =>
												setFormData(prev => ({
													...prev,
													status: option?.value as
														| 'activo'
														| 'inactivo'
														| 'banneado',
												}))
											}
											options={statusOptions}
											styles={customStyles}
											isSearchable={false}
											placeholder="Seleccionar estado"
											isDisabled={isLoading}
											className="pl-10"
										/>
									</div>
									{formData.status === 'banneado' && (
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
};
