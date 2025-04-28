import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	X,
	Building2,
	XCircle,
	Save,
	Upload,
	Image as ImageIcon,
} from 'lucide-react';

interface Logo {
	thumb_medium: string;
	thumb_small: string;
	full_size: string;
}

interface Sello {
	catalog_num: number;
	company: string;
	contract_received: boolean;
	id: number;
	information_accepted: boolean;
	label_approved: boolean;
	logo: Logo;
	name: string;
	primary_genre: string;
	year: number;
}

interface UpdateSelloModalProps {
	sello: Sello;
	isOpen: boolean;
	onClose: () => void;
	onSave: (updatedSello: Sello) => void;
}

const UpdateSelloModal: React.FC<UpdateSelloModalProps> = ({
	sello,
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState<Sello>(sello);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(
		sello.logo?.thumb_medium || null
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setFormData(sello);
	}, [sello]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target;

		if (type === 'checkbox') {
			const checkbox = e.target as HTMLInputElement;
			setFormData({
				...formData,
				[name]: checkbox.checked,
			});
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
				// Remove the data:image/jpeg;base64, prefix
				const base64Data = base64String.split(',')[1];
				setImagePreview(base64String);
				setFormData(prev => ({
					...prev,
					logo: {
						...prev.logo,
						thumb_medium: base64String,
						thumb_small: base64String,
						full_size: base64String,
					},
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Here you would typically make an API call to update the sello
			// For now, we'll just call the onSave function with the updated data
			await onSave(formData);
		} catch (error) {
			console.error('Error updating sello:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.2 }}
						className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
					>
						<div className="p-6 border-b border-gray-200 flex justify-between items-center">
							<h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
								<Building2 className="h-5 w-5 text-brand-light" />
								Editar Sello
							</h2>
							<button
								onClick={onClose}
								className="text-gray-500 hover:text-gray-700 transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Nombre
										</label>
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Empresa
										</label>
										<input
											type="text"
											name="company"
											value={formData.company}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Número de Catálogo
										</label>
										<input
											type="number"
											name="catalog_num"
											value={formData.catalog_num}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Género Principal
										</label>
										<input
											type="text"
											name="primary_genre"
											value={formData.primary_genre}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>
								</div>

								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Año
										</label>
										<input
											type="number"
											name="year"
											value={formData.year}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div className="space-y-2">
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
									</div>

									{formData.logo && (
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Logo Actual
											</label>
											<div className="flex items-center gap-4">
												<div className="w-32 h-32 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
													{imagePreview ? (
														<img
															src={imagePreview}
															alt="Logo del sello"
															className="w-full h-full object-contain"
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
														Cambiar logo
													</button>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>

							<div className="mt-8 flex justify-end gap-3">
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
											<span>Guardando...</span>
										</>
									) : (
										<>
											<Save className="h-4 w-4 group-hover:text-brand-dark" />
											<span className="group-hover:text-brand-dark">
												Guardar cambios
											</span>
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
};

export default UpdateSelloModal;
