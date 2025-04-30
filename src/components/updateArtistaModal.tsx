import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ImageIcon, Upload, Save, XCircle } from 'lucide-react';

interface Artista {
	_id: string;
	external_id: string;
	name: string;
	email: string;
	password?: string;
	picture?: { base64: string };
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
	[key: string]: any;
}

interface UpdateArtistaModalProps {
	artista: Artista;
	isOpen: boolean;
	onClose: () => void;
	onSave: (artista: Artista) => void;
}

const UpdateArtistaModal: React.FC<UpdateArtistaModalProps> = ({
	artista,
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState<Artista>({
		...artista,
		external_id: artista.external_id || artista._id, // Use external_id if available, fallback to _id
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(
		artista.picture ? `data:image/jpeg;base64,${artista.picture.base64}` : null
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
				// Mantener el prefijo data:image/jpeg;base64, para la vista previa
				setImagePreview(base64String);

				// Para enviar a la API, usar solo la parte base64 sin el prefijo
				const base64Data = base64String.split(',')[1];
				setFormData({
					...formData,
					picture: { base64: base64Data },
				});
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			await onSave(formData);
		} catch (error) {
			console.error('Error saving artista:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

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
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
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
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
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
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
								placeholder="Dejar en blanco para mantener la contraseña actual"
							/>
						</div>

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
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
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
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
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
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
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
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
							/>
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
