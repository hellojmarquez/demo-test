import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, XCircle, Upload } from 'lucide-react';

interface CreateSelloModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (selloData: {
		name: string;
		email: string;
		password: string;
		primary_genre: string;
		year: number;
		catalog_num: number;
		picture?: {
			base64: string;
		};
	}) => Promise<void>;
}

function CreateSelloModal({
	isOpen,
	onClose,
	onSave,
}: CreateSelloModalProps): JSX.Element {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		primary_genre: '',
		year: '',
		catalog_num: '',
		picture: undefined as { base64: string } | undefined,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState('');

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		if (name === 'year') {
			// Solo permitir números y máximo 4 dígitos
			if (/^\d{0,4}$/.test(value)) {
				setFormData(prev => ({
					...prev,
					[name]: value,
				}));
			}
		} else if (name === 'catalog_num') {
			// Solo permitir enteros positivos para el número de catálogo
			const regex = /^\d*$/;

			if (regex.test(value)) {
				setFormData(prev => ({
					...prev,
					[name]: value,
				}));
			}
		} else {
			// Para otros campos
			setFormData(prev => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64String = reader.result as string;
				// Mantener el prefijo data:image/jpeg;base64, para la vista previa
				setImagePreview(base64String);

				// Para enviar a la API, usar solo la parte base64 sin el prefijo
				const base64Data = base64String.split(',')[1];
				setFormData(prev => ({
					...prev,
					picture: { base64: base64Data },
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError('');

		try {
			const formDataToSend = new FormData();
			formDataToSend.append('name', formData.name);
			formDataToSend.append('email', formData.email);
			formDataToSend.append('password', formData.password);
			formDataToSend.append('primary_genre', formData.primary_genre);
			formDataToSend.append(
				'year',
				formData.year ? parseInt(formData.year).toString() : ''
			);
			formDataToSend.append(
				'catalog_num',
				formData.catalog_num ? parseInt(formData.catalog_num).toString() : ''
			);

			if (formData.picture?.base64) {
				// Convertir base64 a Blob
				const base64Data = formData.picture.base64;
				const byteCharacters = atob(base64Data);
				const byteArrays = [];

				for (let offset = 0; offset < byteCharacters.length; offset += 512) {
					const slice = byteCharacters.slice(offset, offset + 512);
					const byteNumbers = new Array(slice.length);

					for (let i = 0; i < slice.length; i++) {
						byteNumbers[i] = slice.charCodeAt(i);
					}

					const byteArray = new Uint8Array(byteNumbers);
					byteArrays.push(byteArray);
				}

				const blob = new Blob(byteArrays, { type: 'image/jpeg' });
				const file = new File([blob], 'sello-picture.jpg', {
					type: 'image/jpeg',
				});
				formDataToSend.append('picture', file);
			}

			const response = await fetch('/api/admin/createSello', {
				method: 'POST',
				body: formDataToSend,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al crear el sello');
			}

			const data = await response.json();
			await onSave(data.sello);
			onClose();
		} catch (err: any) {
			setError(err.message || 'Error al crear el sello');
		} finally {
			setIsSubmitting(false);
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
						className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
						onClick={e => e.stopPropagation()}
					>
						<div className="p-4 border-b border-gray-200 flex justify-between items-center">
							<h2 className="text-xl font-semibold text-gray-800">
								Crear Sello
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="flex flex-col flex-1">
							<div className="p-4 space-y-4 overflow-y-auto flex-1">
								<div className="space-y-3">
									<div className="space-y-2">
										<label className="block text-sm font-medium text-gray-700">
											Logo del Sello
										</label>
										<div className="flex items-center gap-3">
											<div className="w-24 h-24 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
												{imagePreview ? (
													<img
														src={imagePreview}
														alt="Preview"
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="text-center">
														<ImageIcon className="mx-auto h-6 w-6 text-gray-400" />
														<span className="mt-1 block text-xs text-gray-500">
															Sin imagen
														</span>
													</div>
												)}
											</div>
											<div>
												<input
													type="file"
													ref={fileInputRef}
													onChange={handleImageChange}
													accept="image/*"
													className="hidden"
												/>
												<button
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
												>
													<Upload className="h-4 w-4 mr-2" />
													Subir imagen
												</button>
											</div>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div>
											<label
												htmlFor="name"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Nombre del Sello
											</label>
											<input
												type="text"
												id="name"
												name="name"
												value={formData.name}
												onChange={handleInputChange}
												className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
												required
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
												value={formData.email}
												onChange={handleInputChange}
												className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
												required
											/>
										</div>
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
											onChange={handleInputChange}
											className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div>
											<label
												htmlFor="primary_genre"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Género Principal
											</label>
											<input
												type="text"
												id="primary_genre"
												name="primary_genre"
												value={formData.primary_genre}
												onChange={handleInputChange}
												className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Año de Fundación
											</label>
											<input
												type="text"
												name="year"
												value={formData.year}
												onChange={handleInputChange}
												onPaste={e => e.preventDefault()}
												maxLength={4}
												className="w-full border border-gray-300 p-2 rounded-lg"
												required
											/>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Número de catálogo
										</label>
										<input
											type="text"
											name="catalog_num"
											value={formData.catalog_num}
											onChange={handleInputChange}
											onPaste={e => e.preventDefault()}
											className="w-full border border-gray-300 p-2 rounded-lg"
											required
										/>
									</div>
								</div>
							</div>

							<div className="flex justify-end gap-3 p-4 border-t border-gray-200">
								<button
									type="button"
									onClick={onClose}
									disabled={isSubmitting}
									className="px-3 py-1.5 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
									<span className="group-hover:text-brand-dark">Cancelar</span>
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-3 py-1.5 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
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
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default CreateSelloModal;
