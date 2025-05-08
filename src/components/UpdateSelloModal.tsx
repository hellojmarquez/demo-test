import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, XCircle, Upload } from 'lucide-react';
import { Sello } from '@/types/sello';

interface UpdateSelloModalProps {
	sello: Sello;
	isOpen: boolean;
	onClose: () => void;
	onSave: (formData: FormData) => Promise<void>;
}

const UpdateSelloModal: React.FC<UpdateSelloModalProps> = ({
	sello,
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState<Sello>({
		...sello,
		assigned_artists: sello.assigned_artists || [],
		tipo: sello.tipo || 'principal',
		parentId: sello.parentId || null,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(() => {
		if (!sello.picture) return null;
		if (typeof sello.picture === 'string') return sello.picture;
		if ('base64' in sello.picture) return sello.picture.base64;
		return null;
	});
	const [parentAccounts, setParentAccounts] = useState<
		Array<{ _id: string; name: string }>
	>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Obtener la lista de cuentas principales
	useEffect(() => {
		const fetchParentAccounts = async () => {
			try {
				const response = await fetch('/api/admin/getAllUsers');
				if (response.ok) {
					const data = await response.json();
					// Filtrar solo las cuentas principales
					const mainAccounts = data.users
						.filter((user: any) => user.tipo === 'principal')
						.map((user: any) => ({
							_id: user._id,
							name: user.name,
						}));
					setParentAccounts(mainAccounts);
				}
			} catch (error) {
				console.error('Error fetching parent accounts:', error);
			}
		};

		if (isOpen) {
			fetchParentAccounts();
		}
	}, [isOpen]);

	// Actualizar la previsualización cuando cambia el sello seleccionado
	useEffect(() => {
		if (!sello.picture) {
			setImagePreview(null);
			return;
		}
		if (typeof sello.picture === 'string') {
			setImagePreview(sello.picture);
		} else if ('base64' in sello.picture) {
			setImagePreview(sello.picture.base64);
		} else {
			setImagePreview(null);
		}
	}, [sello]);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value, type } = e.target;

		if (name === 'year' || name === 'catalog_num') {
			// Solo permitir números
			if (/^\d*$/.test(value)) {
				setFormData({
					...formData,
					[name]: value === '' ? 0 : parseInt(value),
				});
			}
		} else if (name === 'parentId') {
			// Cuando cambia el parentId, actualizar también el parentName
			const selectedParent = parentAccounts.find(
				account => account._id === value
			);
			setFormData({
				...formData,
				parentId: value,
				parentName: selectedParent?.name || null,
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
			// Guardar el archivo directamente
			setFormData(prev => ({
				...prev,
				picture: file,
			}));

			// Crear una URL para la vista previa
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
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
					[name]: value === '' ? 0 : parseInt(value),
				});
			}
		} else if (name === 'catalog_num') {
			// Solo permitir enteros positivos para el número de catálogo
			const regex = /^\d*$/;

			if (regex.test(value)) {
				setFormData({
					...formData,
					[name]: value === '' ? 0 : parseInt(value),
				});
			}
		} else {
			// Para otros campos
			setFormData({
				...formData,
				[name]: value,
			});
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const formDataToSend = new FormData();

			// Agregar el ID al FormData
			formDataToSend.append('_id', formData._id);

			// Agregar los datos del formulario como JSON string
			const dataToSend = {
				...formData,
				year: parseInt(formData.year.toString()),
				catalog_num: parseInt(formData.catalog_num.toString()),
				external_id: formData.external_id
					? parseInt(formData.external_id.toString())
					: undefined,
				picture:
					typeof formData.picture === 'string' ? formData.picture : undefined, // Mantener la imagen existente si no es un File
			};
			formDataToSend.append('data', JSON.stringify(dataToSend));

			// Si hay una imagen nueva, agregarla como File
			if (formData.picture instanceof File) {
				formDataToSend.append('picture', formData.picture);
			}

			await onSave(formDataToSend);
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
											htmlFor="tipo"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Tipo de Cuenta
										</label>
										<select
											id="tipo"
											name="tipo"
											value={formData.tipo}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
										>
											<option value="principal">Cuenta Principal</option>
											<option value="subcuenta">Subcuenta</option>
										</select>
									</div>

									{formData.tipo === 'subcuenta' && (
										<div>
											<label
												htmlFor="parentId"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Cuenta Principal
											</label>
											<select
												id="parentId"
												name="parentId"
												value={formData.parentId || ''}
												onChange={handleChange}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											>
												<option value="">Seleccionar cuenta principal</option>
												{parentAccounts.map(account => (
													<option key={account._id} value={account._id}>
														{account.name}
													</option>
												))}
											</select>
										</div>
									)}

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
											value={formData.assigned_artists?.join(', ') || ''}
											onChange={e => {
												const artists = e.target.value
													.split(',')
													.map(artist => artist.trim())
													.filter(artist => artist.length > 0);
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
