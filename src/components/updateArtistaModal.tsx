import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
	X,
	ImageIcon,
	Upload,
	Save,
	XCircle,
	AlertTriangle,
} from 'lucide-react';
import Select from 'react-select';

interface Artista {
	_id: string;
	external_id?: string | number;
	name: string;
	email: string;
	password?: string;
	picture?: string;
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
	role: string;
	status?: string;
	[key: string]: any;
}

interface UpdateArtistaModalProps {
	artista: Artista;
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: FormData | Artista) => Promise<void>;
}

const statusOptions = [
	{ value: 'active', label: 'Activo' },
	{ value: 'inactive', label: 'Inactivo' },
	{ value: 'banned', label: 'Banneado' },
];

const UpdateArtistaModal: React.FC<UpdateArtistaModalProps> = ({
	artista,
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState<Artista>({
		...artista,
		external_id: artista.external_id || artista._id,
		status: artista.status || 'active',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(
		artista.picture
			? artista.picture.startsWith('data:')
				? artista.picture
				: `data:image/jpeg;base64,${artista.picture}`
			: null
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

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
				setImagePreview(base64String);
				setFormData({
					...formData,
					picture: base64String.split(',')[1], // Extraer solo la parte base64 sin el prefijo data:image/...
				});
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (formData.picture && formData.picture !== artista.picture) {
				const formDataToSend = new FormData();

				formDataToSend.append('name', formData.name);
				formDataToSend.append('email', formData.email);
				formDataToSend.append('role', 'artista');
				formDataToSend.append('_id', formData._id);
				formDataToSend.append(
					'external_id',
					formData.external_id?.toString() || ''
				);

				if (formData.password) {
					formDataToSend.append('password', formData.password);
				}

				formDataToSend.append(
					'amazon_music_identifier',
					formData.amazon_music_identifier || ''
				);
				formDataToSend.append(
					'apple_identifier',
					formData.apple_identifier || ''
				);
				formDataToSend.append(
					'deezer_identifier',
					formData.deezer_identifier || ''
				);
				formDataToSend.append(
					'spotify_identifier',
					formData.spotify_identifier || ''
				);

				const response = await fetch(formData.picture);
				const blob = await response.blob();
				const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
				formDataToSend.append('picture', file);
				console.log('formDataToSend', formDataToSend);
				await onSave(formDataToSend);
			} else {
				const updatedFormData = {
					...formData,
					amazon_music_identifier: formData.amazon_music_identifier || '',
					apple_identifier: formData.apple_identifier || '',
					deezer_identifier: formData.deezer_identifier || '',
					spotify_identifier: formData.spotify_identifier || '',
				};
				await onSave(updatedFormData);
			}
		} catch (error) {
			console.error('Error saving artista:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">Editar Artista</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full"
					>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6">
					<div className="space-y-2 mb-6">
						<label className="block text-sm font-medium text-gray-700">
							Foto de Perfil
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
								className={inputStyles}
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
								onChange={handleChange}
								className={inputStyles}
								required
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
								value={formData.password || ''}
								onChange={handleChange}
								className={inputStyles}
								placeholder="Dejar en blanco para mantener la contraseña actual"
							/>
						</div>

						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Estado
							</label>
							<Select
								value={
									statusOptions.find(
										option => option.value === formData.status
									) || null
								}
								onChange={selectedOption =>
									setFormData(prev => ({
										...prev,
										status: selectedOption?.value || 'active',
									}))
								}
								options={statusOptions}
								className="basic-single"
								classNamePrefix="select"
								placeholder="Selecciona un estado"
								isClearable={false}
								styles={{
									control: (base, state) => ({
										...base,
										border: 'none',
										borderBottom: '2px solid #E5E7EB',
										borderRadius: '0',
										boxShadow: 'none',
										backgroundColor: 'transparent',
										'&:hover': {
											borderBottom: '2px solid #4B5563',
										},
										'&:focus-within': {
											borderBottom: '2px solid #4B5563',
										},
									}),
									option: (base, state) => ({
										...base,
										backgroundColor: state.isSelected
											? '#4B5563'
											: state.isFocused
											? '#E5E7EB'
											: 'white',
										color: state.isSelected ? 'white' : '#1F2937',
										'&:hover': {
											backgroundColor: state.isSelected ? '#4B5563' : '#E5E7EB',
										},
									}),
									menu: base => ({
										...base,
										borderRadius: '0.375rem',
										boxShadow:
											'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
									}),
									placeholder: base => ({
										...base,
										color: '#9CA3AF',
									}),
									singleValue: base => ({
										...base,
										color: '#1F2937',
									}),
								}}
							/>
							{formData.status === 'banned' && (
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

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="amazon_music_identifier"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Identificador Amazon Music
								</label>
								<input
									type="text"
									id="amazon_music_identifier"
									name="amazon_music_identifier"
									value={formData.amazon_music_identifier || ''}
									onChange={handleChange}
									className={inputStyles}
								/>
							</div>

							<div>
								<label
									htmlFor="apple_identifier"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Identificador Apple
								</label>
								<input
									type="text"
									id="apple_identifier"
									name="apple_identifier"
									value={formData.apple_identifier || ''}
									onChange={handleChange}
									className={inputStyles}
								/>
							</div>

							<div>
								<label
									htmlFor="deezer_identifier"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Identificador Deezer
								</label>
								<input
									type="text"
									id="deezer_identifier"
									name="deezer_identifier"
									value={formData.deezer_identifier || ''}
									onChange={handleChange}
									className={inputStyles}
								/>
							</div>

							<div>
								<label
									htmlFor="spotify_identifier"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Identificador Spotify
								</label>
								<input
									type="text"
									id="spotify_identifier"
									name="spotify_identifier"
									value={formData.spotify_identifier || ''}
									onChange={handleChange}
									className={inputStyles}
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
			</div>
		</div>
	);
};

export default UpdateArtistaModal;
