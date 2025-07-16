import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateContributorModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (contributorData: {
		name: string;
		email: string;
		password: string;
	}) => Promise<void>;
}

export default function CreateContributorModal({
	isOpen,
	onClose,
	onSave,
}: CreateContributorModalProps) {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nameError, setNameError] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<string | null>(null);

	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
		setError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);
		setNameError(null);
		setEmailError(null);
		let hasError = false;
		if (
			!formData.name.trim() ||
			!formData.email.trim() ||
			!formData.password.trim()
		) {
			setError('Todos los campos son requeridos');
			hasError = true;
			return;
		}
		const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		const regexName = /^[a-zA-Z\s]+$/;
		if (!regex.test(formData.email)) {
			setEmailError('El email no es válido');
			hasError = true;
		}
		if (!regexName.test(formData.name)) {
			setNameError('El nombre no es válido');
			hasError = true;
		}
		if (hasError) {
			setIsSubmitting(false);
			setError('Por favor, corrige los errores en el formulario');
			return;
		}

		try {
			const response = await fetch('/api/admin/createContributor', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
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

			await onSave(data.contributor);
			setFormData({ name: '', email: '', password: '' });
			onClose();
		} catch (err) {
			console.error('Error creating contributor:', err);
			setError(
				err instanceof Error ? err.message : 'Error al crear el contribuidor'
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black bg-opacity-50"
						onClick={onClose}
					/>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-10"
					>
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold text-gray-800">
								Crear Contribuidor
							</h2>
							<button
								onClick={onClose}
								className="text-gray-500 hover:text-gray-700 transition-colors"
							>
								<XCircle size={24} />
							</button>
						</div>

						<form className="space-y-4">
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
									placeholder="Nombre y apellido"
									value={formData.name}
									onChange={handleChange}
									className={inputStyles}
									required
								/>
								{nameError && nameError.length > 0 && (
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
									value={formData.email}
									onChange={handleChange}
									className={inputStyles}
									required
								/>
								{emailError && emailError.length > 0 && (
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
									value={formData.password}
									onChange={handleChange}
									className={inputStyles}
									required
								/>
							</div>

							{error && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
									{error}
								</div>
							)}

							<div className="flex justify-end space-x-3 mt-6">
								<button
									type="button"
									onClick={onClose}
									disabled={isSubmitting}
									className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
									<span className="group-hover:text-brand-dark">Cancelar</span>
								</button>
								<button
									type="button"
									onClick={handleSubmit}
									disabled={isSubmitting}
									className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSubmitting ? (
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
				</div>
			)}
		</AnimatePresence>
	);
}
