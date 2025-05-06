import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, XCircle, Upload } from 'lucide-react';
import { Sello } from '@/types/sello';

interface UpdateSelloModalProps {
	sello: Sello;
	isOpen: boolean;
	onClose: () => void;
	onSave: (sello: Sello) => void;
}

const UpdateSelloModal: React.FC<UpdateSelloModalProps> = ({
	sello,
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState<Sello>({ ...sello });
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(
		sello.picture ? `data:image/jpeg;base64,${sello.picture.base64}` : null
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Actualizar la previsualización cuando cambia el sello seleccionado
	useEffect(() => {
		if (sello.picture) {
			setImagePreview(`data:image/jpeg;base64,${sello.picture.base64}`);
		} else {
			setImagePreview(null);
		}
	}, [sello]);

	useEffect(() => {
		console.log('Sello recibido en modal:', sello);
		console.log('Previsualización de imagen:', imagePreview);
	}, [sello, imagePreview]);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value, type } = e.target;

		if (type === 'checkbox') {
			const checkbox = e.target as HTMLInputElement;
			setFormData({
				...formData,
				[name]: checkbox.checked,
			});
		} else if (name === 'year' || name === 'catalog_num') {
			// Solo permitir números
			if (/^\d*$/.test(value)) {
				const numericValue = value === '' ? '' : Number(value);
				setFormData({
					...formData,
					[name]: numericValue,
				});
			}
		} else {
			setFormData({
				...formData,
				[name]: value,
			});
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
				setFormData({
					...formData,
					picture: { base64: base64Data },
				});
				console.log('Imagen procesada:', base64Data.substring(0, 50) + '...');
			};
			reader.readAsDataURL(file);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		if (name === 'year') {
			// Solo permitir números y máximo 4 dígitos
			if (/^\d{0,4}$/.test(value)) {
				setFormData({
					...formData,
					[name]: value === '' ? '' : parseInt(value),
				});
			}
		} else if (name === 'catalog_num') {
			// Solo permitir enteros positivos para el número de catálogo
			const regex = /^\d*$/;

			if (regex.test(value)) {
				if (value === '') {
					setFormData({
						...formData,
						[name]: '',
					});
				} else {
					const numValue = parseInt(value);
					const isMinValid = numValue >= 0;
					if (isMinValid) {
						setFormData({
							...formData,
							[name]: numValue,
						});
					}
				}
			}
		} else {
			// Para otros campos
			setFormData({
				...formData,
				[name]: value,
			});
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Solo permitir números y teclas de control
		const allowedKeys = [
			'Backspace',
			'Delete',
			'ArrowLeft',
			'ArrowRight',
			'Tab',
			'Home',
			'End',
		];

		if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key)) {
			e.preventDefault();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			console.log('Enviando datos:', {
				...formData,
				picture: formData.picture
					? formData.picture.base64.substring(0, 50) + '...'
					: 'No hay imagen',
			});
			await onSave(formData);
		} catch (error) {
			console.error('Error saving sello:', error);
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
						className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
						onClick={e => e.stopPropagation()}
					>
						<div className="p-6 border-b border-gray-200 flex justify-between items-center">
							<h2 className="text-xl font-semibold text-gray-800">
								Editar Sello
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6">
							<div className="space-y-2 mb-6">
								<label className="block text-sm font-medium text-gray-700">
									Logo del Sello
								</label>
								<div className="flex items-center gap-4">
									<div className="w-32 h-32 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
										{imagePreview ? (
											<img
												src={imagePreview}
												alt="Preview"
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="text-center">
												<ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
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
											className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
										>
											<Upload className="h-4 w-4 mr-2" />
											Cambiar imagen
										</button>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
											value={formData.name}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div>
										<label
											htmlFor="catalog_num"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Número de Catálogo
										</label>
										<input
											type="text"
											id="catalog_num"
											name="catalog_num"
											value={formData.catalog_num}
											onChange={handleInputChange}
											onPaste={e => e.preventDefault()}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div>
										<label
											htmlFor="year"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Año
										</label>
										<input
											type="text"
											id="year"
											name="year"
											value={formData.year}
											onChange={handleInputChange}
											onPaste={e => e.preventDefault()}
											maxLength={4}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div>
										<label
											htmlFor="status"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Estado
										</label>
										<select
											id="status"
											name="status"
											value={formData.status}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
										>
											<option value="active">Activo</option>
											<option value="inactive">Inactivo</option>
										</select>
									</div>
								</div>

								<div className="space-y-4">
									<div className="flex items-center">
										<input
											type="checkbox"
											id="contract_received"
											name="contract_received"
											checked={formData.contract_received}
											onChange={handleChange}
											className="h-4 w-4 text-brand-light focus:ring-brand-light border-gray-300 rounded"
										/>
										<label
											htmlFor="contract_received"
											className="ml-2 block text-sm text-gray-700"
										>
											Contrato Recibido
										</label>
									</div>

									<div className="flex items-center">
										<input
											type="checkbox"
											id="information_accepted"
											name="information_accepted"
											checked={formData.information_accepted}
											onChange={handleChange}
											className="h-4 w-4 text-brand-light focus:ring-brand-light border-gray-300 rounded"
										/>
										<label
											htmlFor="information_accepted"
											className="ml-2 block text-sm text-gray-700"
										>
											Información Aceptada
										</label>
									</div>

									<div className="flex items-center">
										<input
											type="checkbox"
											id="label_approved"
											name="label_approved"
											checked={formData.label_approved}
											onChange={handleChange}
											className="h-4 w-4 text-brand-light focus:ring-brand-light border-gray-300 rounded"
										/>
										<label
											htmlFor="label_approved"
											className="ml-2 block text-sm text-gray-700"
										>
											Label Aprobado
										</label>
									</div>

									<div>
										<label
											htmlFor="assigned_artists"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Artistas Asignados
										</label>
										<textarea
											id="assigned_artists"
											name="assigned_artists"
											value={formData.assigned_artists.join(', ')}
											onChange={e => {
												const artists = e.target.value
													.split(',')
													.map(artist => artist.trim())
													.filter(artist => artist !== '');
												setFormData({
													...formData,
													assigned_artists: artists,
												});
											}}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											rows={3}
											placeholder="Ingresa los artistas separados por comas"
										/>
									</div>
								</div>
							</div>

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
									type="submit"
									disabled={isSubmitting}
									className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSubmitting ? (
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

export default UpdateSelloModal;
