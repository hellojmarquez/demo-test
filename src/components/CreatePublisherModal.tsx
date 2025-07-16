'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreatePublisherModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: () => void;
}

export function CreatePublisherModal({
	isOpen,
	onClose,
	onCreate,
}: CreatePublisherModalProps) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nameError, setNameError] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<string | null>(null);

	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setNameError(null);
		setEmailError(null);
		setError(null);
		let hasError = false;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
		if (!name || !nameRegex.test(name)) {
			setNameError(
				'El nombre es requerido y no debe tener caracteres especiales ni números'
			);
			hasError = true;
		}
		if (!email || !emailRegex.test(email)) {
			setEmailError('El email es requerido y el formato debe ser correcto');
			hasError = true;
		}
		if (hasError) {
			setError('Por favor, corrige los errores en el formulario');
			setIsLoading(false);
			return;
		}
		try {
			const response = await fetch('/api/admin/createPublisher', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name, email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
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
				setError(errorMessage);
				throw new Error(errorMessage);
			}

			toast.success('Publisher creado con éxito');
			onClose();
			onCreate();
		} catch (error) {
			console.error('Error creating publisher:', error);
			toast.error(
				error instanceof Error ? error.message : 'Error al crear el publisher'
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
								Crear Publisher
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form className="p-6">
							<div className="space-y-4">
								<div>
									<label
										htmlFor="name"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Nombre
									</label>
									<input
										id="name"
										type="text"
										value={name}
										onChange={e => setName(e.target.value)}
										placeholder="Nombre y apellido"
										required
										className={inputStyles}
									/>
									{nameError && (
										<p className="text-red-500 text-[9px] mt-1">{nameError}</p>
									)}
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
										placeholder="nombre@email.com"
										value={email}
										onChange={e => setEmail(e.target.value)}
										className={inputStyles}
										required
									/>
									{emailError && (
										<p className="text-red-500 text-[9px] mt-1">{emailError}</p>
									)}
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
										required
									/>
								</div>
							</div>
							{error && error.length > 0 && (
								<div className="mb-4 p-4 bg-red-200 text-red-700 rounded-md">
									{error}
								</div>
							)}
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
									type="button"
									onClick={handleSubmit}
									disabled={isLoading}
									className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
											<span>Creando...</span>
										</>
									) : (
										<>
											<Save className="h-4 w-4 group-hover:text-brand-dark" />
											<span className="group-hover:text-brand-dark">Crear</span>
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
