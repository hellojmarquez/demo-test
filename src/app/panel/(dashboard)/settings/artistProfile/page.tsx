'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	ImageIcon,
	Lock,
	Mail,
	Save,
	Upload,
	User,
	Camera,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import toast from 'react-hot-toast';

const ArtistProfile = () => {
	const { userData, error: settingsError, isLoading } = useSettings();
	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		name: userData?.name || '',
		email: userData?.email || '',
		password: '',
		picture: userData?.picture || '',
		spotify_identifier: userData?.spotify_identifier || '',
		apple_music_identifier: userData?.apple_music_identifier || '',
		amazon_music_identifier: userData?.amazon_music_identifier || '',
		youtube_music_identifier: userData?.youtube_music_identifier || '',
		deezer_identifier: userData?.deezer_identifier || '',
	});

	const [imagePreview, setImagePreview] = useState<string | null>(() => {
		if (!userData?.picture) return null;
		return `data:image/jpeg;base64,${userData.picture}`;
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (userData?.name) {
			setFormData(prev => ({
				...prev,
				name: userData.name,
				email: userData.email || prev.email,
				picture: userData.picture || prev.picture,
			}));
			if (userData.picture) {
				setImagePreview(`data:image/jpeg;base64,${userData.picture}`);
			}
		}
	}, [userData]);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-brand-light"></div>
			</div>
		);
	}

	if (settingsError) {
		return <div>Error al cargar los datos del usuario</div>;
	}

	if (!userData) {
		return <div>No se encontraron datos del usuario</div>;
	}

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
				const base64Data = base64String.split(',')[1];
				setFormData(prev => ({
					...prev,
					picture: base64Data,
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			const formDataToSend = new FormData();
			formDataToSend.append('name', formData.name);
			formDataToSend.append('email', formData.email);
			formDataToSend.append('role', userData.role);
			formDataToSend.append('_id', userData._id);
			formDataToSend.append(
				'external_id',
				userData.external_id?.toString() || ''
			);

			if (formData.password) {
				formDataToSend.append('password', formData.password);
			}

			if (formData.picture && formData.picture !== userData.picture) {
				formDataToSend.append('picture', formData.picture);
			}

			const response = await fetch(
				`/api/admin/updateArtist/${userData.external_id}`,
				{
					method: 'PUT',
					body: formDataToSend,
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al actualizar el perfil');
			}

			const data = await response.json();
			if (data.success) {
				toast.success('Artista actualizado correctamente');
			} else {
				throw new Error(data.error || 'Error al actualizar el perfil');
			}
		} catch (error) {
			console.error('Error saving artista:', error);
			setError(
				error instanceof Error ? error.message : 'Error al guardar el artista'
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				transition={{ type: 'spring', damping: 25, stiffness: 300 }}
				className="bg-white mx-auto w-full max-w-[70%]"
				onClick={e => e.stopPropagation()}
			>
				<div className="p-6 border-b border-gray-200 flex justify-between items-center">
					<h2 className="text-xl font-semibold text-gray-800">
						Editar Artista
					</h2>
				</div>

				<form onSubmit={handleSubmit} className="p-6">
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
							{error}
						</div>
					)}

					<div className="flex flex-col space-y-4">
						<div className="flex flex-col space-y-4">
							<div className="mx-auto relative w-36 h-36">
								<div className="w-full h-full border-2 rounded-full flex shadow-lg items-center justify-center overflow-hidden">
									{imagePreview ? (
										<img
											src={imagePreview}
											alt="Preview"
											className="w-full h-full object-cover"
										/>
									) : (
										<User className="w-16 h-16 text-gray-400" />
									)}
								</div>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="absolute bottom-0 right-0 bg-brand-dark text-white p-2 rounded-full shadow-lg hover:bg-brand-light transition-colors"
								>
									<Camera className="w-5 h-5" />
								</button>
								<input
									type="file"
									ref={fileInputRef}
									className="hidden"
									accept="image/*"
									onChange={handleImageChange}
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="name"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Nombre
							</label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
								<input
									type="text"
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									className={`${inputStyles} pl-10`}
									required
									disabled={isSubmitting}
								/>
							</div>
						</div>
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Email
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
								<input
									type="email"
									id="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									className={`${inputStyles} pl-10`}
									required
									disabled={isSubmitting}
								/>
							</div>
						</div>
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Contraseña (Opcional)
							</label>
							<div className="relative">
								<input
									type="password"
									name="password"
									value={formData.password}
									onChange={handleChange}
									className={inputStyles}
									placeholder="Dejar en blanco para mantener la actual"
								/>
								<Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
							</div>
						</div>

						<div className="space-y-4">
							<h3 className="text-lg py-2 text-center font-medium text-gray-900">
								Identificadores de Plataformas
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="spotify_identifier"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Spotify
									</label>
									<div className="relative">
										<img
											src="/icons/spotify_logo.svg"
											alt="Spotify Logo"
											className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
										/>
										<input
											type="text"
											id="spotify_identifier"
											name="spotify_identifier"
											value={formData.spotify_identifier || ''}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											placeholder="ID de Spotify"
										/>
									</div>
								</div>
								<div>
									<label
										htmlFor="apple_music_identifier"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Apple Music
									</label>
									<div className="relative">
										<img
											src="/icons/ITunes_logo.svg"
											alt="Apple Music Logo"
											className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
										/>
										<input
											type="text"
											id="apple_music_identifier"
											name="apple_music_identifier"
											value={formData.apple_music_identifier || ''}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											placeholder="ID de Apple Music"
										/>
									</div>
								</div>
								<div>
									<label
										htmlFor="amazon_music_identifier"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Amazon Music
									</label>
									<div className="relative">
										<img
											src="/icons/Amazon_Music_logo.svg"
											alt="Amazon Music Logo"
											className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
										/>
										<input
											type="text"
											id="amazon_music_identifier"
											name="amazon_music_identifier"
											value={formData.amazon_music_identifier || ''}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											placeholder="ID de Amazon Music"
										/>
									</div>
								</div>
								<div>
									<label
										htmlFor="youtube_music_identifier"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										YouTube Music
									</label>
									<div className="relative">
										<img
											src="/icons/Youtube_Music_icon.svg"
											alt="YouTube Music Logo"
											className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
										/>
										<input
											type="text"
											id="youtube_music_identifier"
											name="youtube_music_identifier"
											value={formData.youtube_music_identifier || ''}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											placeholder="ID de YouTube Music"
										/>
									</div>
								</div>
								<div>
									<label
										htmlFor="deezer_identifier"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Deezer
									</label>
									<div className="relative">
										<img
											src="/icons/dezzer_logo.svg"
											alt="Deezer Logo"
											className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
										/>
										<input
											type="text"
											id="deezer_identifier"
											name="deezer_identifier"
											value={formData.deezer_identifier || ''}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											placeholder="ID de Deezer"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-6 flex justify-end space-x-3">
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
		</AnimatePresence>
	);
};

export default ArtistProfile;
