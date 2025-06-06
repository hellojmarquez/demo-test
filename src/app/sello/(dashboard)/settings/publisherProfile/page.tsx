'use client';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import toast from 'react-hot-toast';
import {
	AlertTriangle,
	Lock,
	Mail,
	Save,
	User,
	UserRoundCheck,
} from 'lucide-react';
const page = () => {
	const { userData, error: settingsError, isLoading } = useSettings();
	const [error, setError] = useState<string | null>(null);
	const [fetchLoading, setFetchLoading] = useState(false);
	const [formData, setFormData] = useState(() => {
		// Valores por defecto seguros
		const defaultValues = {
			name: '',
			email: '',
			password: '',
			status: 'activo' as const,
		};

		// Si no hay userData, retornar valores por defecto
		if (!userData) {
			return defaultValues;
		}

		// Si hay userData, mezclar con valores por defecto
		return {
			name: userData.name || defaultValues.name,
			email: userData.email || defaultValues.email,
			password: userData.password || defaultValues.password,
			status: userData.status || defaultValues.status,
		};
	});
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		console.log(`Cambiando ${name} a:`, value);
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
	};
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFetchLoading(true);
		setError(null);

		try {
			if (!userData.external_id) {
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
				`/api/admin/updatePublisher/${userData.external_id}`,
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
				throw new Error(data.error || 'Error al actualizar el publisher');
			}

			toast.success('Cuenta actualizada con éxito');
		} catch (error) {
			console.error('Error updating publisher:', error);
			setError(
				error instanceof Error
					? error.message
					: 'Error al actualizar el publisher'
			);
			toast.error(
				error instanceof Error ? error.message : 'Error al actualizar la cuenta'
			);
		} finally {
			setFetchLoading(false);
		}
	};
	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';
	useEffect(() => {
		if (userData) {
			setFormData(prev => ({
				...prev,
				name: userData.name || prev.name,
				email: userData.email || prev.email,
				password: userData.password || prev.password,
				status:
					(userData.status === 'pendiente' ? 'activo' : userData.status) ||
					prev.status,
			}));
		}
		console.log('publisheer', userData);
	}, [userData]);
	return (
		<AnimatePresence>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				transition={{ type: 'spring', damping: 25, stiffness: 300 }}
				className="bg-white mx-auto w-full max-w-[70%]"
				onClick={e => e.stopPropagation()}
			>
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
									disabled={fetchLoading}
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
							<p className="flex text-sm gap-x-2 font-medium text-gray-700 mb-1">
								<UserRoundCheck className="h-5 w-5 text-gray-400" />
								Estado: <span className="font-bold">{formData.status}</span>
							</p>
						</div>
					</div>

					<div className="mt-6 flex justify-end space-x-3">
						<button
							type="submit"
							disabled={fetchLoading}
							className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{fetchLoading ? (
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
		</AnimatePresence>
	);
};

export default page;
