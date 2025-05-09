import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, XCircle, Upload } from 'lucide-react';

interface CreateArtistModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (artistData: {
		name: string;
		email: string;
		password: string;
		amazon_music_identifier: string;
		apple_identifier: string;
		deezer_identifier: string;
		spotify_identifier: string;
		picture?: {
			base64: string;
		};
		isSubaccount?: boolean;
		parentUserId?: string;
	}) => Promise<void>;
}

function CreateArtistModal({
	isOpen,
	onClose,
	onSave,
}: CreateArtistModalProps): JSX.Element {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		amazon_music_identifier: '',
		apple_identifier: '',
		deezer_identifier: '',
		spotify_identifier: '',
		picture: undefined as { base64: string } | undefined,
		isSubaccount: false,
		parentUserId: '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState('');
	const [availableParents, setAvailableParents] = useState<
		Array<{ _id: string; name: string }>
	>([]);

	useEffect(() => {
		const fetchAvailableParents = async () => {
			try {
				const response = await fetch('/api/admin/getAllUsers');
				if (response.ok) {
					const data = await response.json();
					setAvailableParents(data.users || []);
				}
			} catch (error) {
				console.error('Error fetching available parents:', error);
			}
		};

		if (isOpen) {
			fetchAvailableParents();
		}
	}, [isOpen]);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value, type } = e.target;

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData(prev => ({
				...prev,
				[name]: checked,
			}));
		} else {
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
			formDataToSend.append('isSubaccount', formData.isSubaccount.toString());
			formDataToSend.append(
				'tipo',
				formData.isSubaccount ? 'subcuenta' : 'principal'
			);
			if (formData.isSubaccount && formData.parentUserId) {
				formDataToSend.append('parentUserId', formData.parentUserId);
				const selectedParent = availableParents.find(
					parent => parent._id === formData.parentUserId
				);
				if (selectedParent) {
					formDataToSend.append('parentName', selectedParent.name);
				}
			}

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
				const file = new File([blob], 'artist-picture.jpg', {
					type: 'image/jpeg',
				});
				formDataToSend.append('picture', file);
			}

			const response = await fetch('/api/admin/createArtist', {
				method: 'POST',
				body: formDataToSend,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al crear el artista');
			}

			const data = await response.json();
			await onSave(data.artist);
			onClose();
		} catch (err: any) {
			setError(err.message || 'Error al crear el artista');
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
						<div className="p-4 border-b border-gray-200 flex justify-between items-center">
							<h2 className="text-xl font-semibold text-gray-800">
								Crear Artista
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-4">
							<div className="space-y-4">
								<div className="space-y-3">
									<div className="space-y-2">
										<label className="block text-sm font-medium text-gray-700">
											Foto de Perfil
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
												Nombre
											</label>
											<input
												type="text"
												id="name"
												name="name"
												value={formData.name}
												onChange={handleChange}
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
												onChange={handleChange}
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
											onChange={handleChange}
											className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div>
											<label
												htmlFor="amazon_music_identifier"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												ID Amazon Music
											</label>
											<input
												type="text"
												id="amazon_music_identifier"
												name="amazon_music_identifier"
												value={formData.amazon_music_identifier}
												onChange={handleChange}
												className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											/>
										</div>

										<div>
											<label
												htmlFor="apple_identifier"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												ID Apple Music
											</label>
											<input
												type="text"
												id="apple_identifier"
												name="apple_identifier"
												value={formData.apple_identifier}
												onChange={handleChange}
												className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											/>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div>
											<label
												htmlFor="deezer_identifier"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												ID Deezer
											</label>
											<input
												type="text"
												id="deezer_identifier"
												name="deezer_identifier"
												value={formData.deezer_identifier}
												onChange={handleChange}
												className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											/>
										</div>

										<div>
											<label
												htmlFor="spotify_identifier"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												ID Spotify
											</label>
											<input
												type="text"
												id="spotify_identifier"
												name="spotify_identifier"
												value={formData.spotify_identifier}
												onChange={handleChange}
												className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											/>
										</div>
									</div>

									<div className="flex items-center space-x-2">
										<input
											type="checkbox"
											id="isSubaccount"
											name="isSubaccount"
											checked={formData.isSubaccount}
											onChange={handleChange}
											className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
										/>
										<label
											htmlFor="isSubaccount"
											className="text-sm text-gray-700"
										>
											Crear como subcuenta
										</label>
									</div>

									{formData.isSubaccount && (
										<div>
											<label
												htmlFor="parentUserId"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Usuario Padre
											</label>
											<select
												id="parentUserId"
												name="parentUserId"
												value={formData.parentUserId}
												onChange={handleChange}
												className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
												required
											>
												<option value="">Seleccionar usuario padre</option>
												{availableParents.map(parent => (
													<option key={parent._id} value={parent._id}>
														{parent.name}
													</option>
												))}
											</select>
										</div>
									)}
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

export default CreateArtistModal;
