import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, XCircle, Upload } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import AsyncSelect from './ui/AsyncSelect';

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

interface ParentOption {
	value: string;
	label: string;
}
interface PlatformOption {
	value: string;
	label: string;
	id?: string;
	image?: string;
	followers?: number;
	popularity?: number;
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
	const [nameError, setNameError] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<string | null>(null);
	const [spotifyOoptions, setSpotifyOoptions] = useState<PlatformOption[]>([]);
	const [deezerOoptions, setDeezerOoptions] = useState<PlatformOption[]>([]);
	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

	const reactSelectStyles = {
		control: (base: any) => ({
			...base,
			border: 'none',
			borderBottom: '2px solid #E5E7EB',
			borderRadius: '0',
			boxShadow: 'none',
			backgroundColor: 'transparent',
			'&:hover': {
				borderBottom: '2px solid #4B5563',
			},
		}),
		option: (base: any, state: { isSelected: boolean }) => ({
			...base,
			backgroundColor: state.isSelected ? '#4B5563' : 'white',
			color: state.isSelected ? 'white' : '#1F2937',
			'&:hover': {
				backgroundColor: state.isSelected ? '#4B5563' : '#F3F4F6',
			},
		}),
		menu: (base: any) => ({
			...base,
			boxShadow: 'none',
			border: '1px solid #E5E7EB',
		}),
	};

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
	const handlePlatformArtistChange = (fieldName: string) => (option: any) => {
		if (option) {
			setFormData(prev => ({
				...prev,
				[fieldName]: option.value,
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
		setNameError(null);
		setEmailError(null);
		let hasError = false;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
		if (!formData.name.trim() || !nameRegex.test(formData.name)) {
			setNameError(
				'El nombre es requerido y no debe tener caracteres especiales ni números'
			);
			hasError = true;
		}
		if (!formData.email.trim() || !emailRegex.test(formData.email)) {
			setEmailError('El email es requerido y el formato debe ser correcto');
			hasError = true;
		}

		if (hasError) {
			setError('Por favor, corrige los errores en el formulario');
			setIsSubmitting(false);
			return;
		}

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
						className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
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

						<form className="p-4">
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

									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
												placeholder="Nombre y apellido"
												name="name"
												value={formData.name}
												onChange={handleChange}
												className={inputStyles}
												required
											/>
											{nameError && (
												<p className="text-red-500 text-[9px] mt-1">
													{nameError}
												</p>
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
											{emailError && (
												<p className="text-red-500 text-[9px] mt-1">
													{emailError}
												</p>
											)}
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
												placeholder="Nombre y apellido"
												name="name"
												value={formData.name}
												onChange={handleChange}
												className={inputStyles}
												required
											/>
											{nameError && (
												<p className="text-red-500 text-[9px] mt-1">
													{nameError}
												</p>
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
											{emailError && (
												<p className="text-red-500 text-[9px] mt-1">
													{emailError}
												</p>
											)}
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
											className={inputStyles}
											required
										/>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div>
											<label
												htmlFor="amazon_music_identifier"
												className="text-center md:text-left block text-sm font-medium text-gray-700 mb-1"
											>
												ID Amazon Music
											</label>
											<input
												type="text"
												id="amazon_music_identifier"
												name="amazon_music_identifier"
												value={formData.amazon_music_identifier}
												onChange={handleChange}
												className={inputStyles}
											/>
										</div>

										<div>
											<label
												htmlFor="apple_identifier"
												className="text-center md:text-left block text-sm font-medium text-gray-700 mb-1"
											>
												ID Apple Music
											</label>
											<AsyncSelect
												loadOptions={async searchTerm => {
													if (!searchTerm.trim() || searchTerm.length < 2) {
														return;
													}
													const spotifyReq = await fetch(
														`/api/admin/getAppleArtists`,
														{
															method: 'POST',
															headers: {
																'Content-Type': 'application/json',
															},
															body: JSON.stringify({ query: searchTerm }),
														}
													);
													console.log('haciendo fetch');
													if (!spotifyReq.ok) {
														setSpotifyOoptions([]);
														return [];
													}
													const spotifyRes = await spotifyReq.json();
													return spotifyRes.data.map((artist: any) => ({
														value: artist.id,
														label: artist.label,
														image: artist.image,
														url: artist.url,
														followers: artist.followers,
														popularity: artist.popularity,
													}));
												}}
												placeholder="Buscar..."
												onChange={handlePlatformArtistChange(
													'apple_identifier'
												)}
											/>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div>
											<label
												htmlFor="deezer_identifier"
												className="text-center md:text-left block text-sm font-medium text-gray-700 mb-1"
											>
												ID Deezer
											</label>
											<AsyncSelect
												loadOptions={async searchTerm => {
													if (!searchTerm.trim() || searchTerm.length < 2) {
														return;
													}
													const spotifyReq = await fetch(
														`/api/admin/getDezeerArtists`,
														{
															method: 'POST',
															headers: {
																'Content-Type': 'application/json',
															},
															body: JSON.stringify({ query: searchTerm }),
														}
													);
													console.log('haciendo fetch');
													if (!spotifyReq.ok) {
														setSpotifyOoptions([]);
														return [];
													}
													const spotifyRes = await spotifyReq.json();
													return spotifyRes.data.map((artist: any) => ({
														value: artist.id,
														label: artist.label,
														image: artist.image,
														url: artist.url,
														followers: artist.followers,
														popularity: artist.popularity,
													}));
												}}
												placeholder="Buscar..."
												onChange={handlePlatformArtistChange(
													'deezer_identifier'
												)}
											/>
										</div>

										<div>
											<label
												htmlFor="spotify_identifier"
												className="text-center md:text-left block text-sm font-medium text-gray-700 mb-1"
											>
												ID Spotify
											</label>
											<AsyncSelect
												loadOptions={async searchTerm => {
													if (!searchTerm.trim() || searchTerm.length < 2) {
														return;
													}
													const spotifyReq = await fetch(
														`/api/admin/getSpotifyArtists`,
														{
															method: 'POST',
															headers: {
																'Content-Type': 'application/json',
															},
															body: JSON.stringify({ query: searchTerm }),
														}
													);
													console.log('haciendo fetch');
													if (!spotifyReq.ok) {
														setSpotifyOoptions([]);
														return [];
													}
													const spotifyRes = await spotifyReq.json();
													return spotifyRes.data.map((artist: any) => ({
														value: artist.id,
														label: artist.label,
														image: artist.image,
														url: artist.url,
														followers: artist.followers,
														popularity: artist.popularity,
													}));
												}}
												placeholder="Buscar..."
												onChange={handlePlatformArtistChange(
													'spotify_identifier'
												)}
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
											<Select
												id="parentUserId"
												name="parentUserId"
												value={
													formData.parentUserId
														? {
																value: formData.parentUserId,
																label:
																	availableParents.find(
																		p => p._id === formData.parentUserId
																	)?.name || '',
														  }
														: null
												}
												onChange={(selectedOption: ParentOption | null) => {
													handleChange({
														target: {
															name: 'parentUserId',
															value: selectedOption?.value || '',
														},
													} as React.ChangeEvent<HTMLSelectElement>);
												}}
												options={availableParents.map(parent => ({
													value: parent._id,
													label: parent.name,
												}))}
												placeholder="Seleccionar usuario padre"
												styles={reactSelectStyles}
												isClearable
												required
											/>
										</div>
									)}
								</div>
							</div>
							{error && (
								<div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
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
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default CreateArtistModal;
