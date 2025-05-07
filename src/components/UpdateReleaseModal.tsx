import React, { useState, useRef, useEffect } from 'react';
import {
	X,
	Upload,
	Image as ImageIcon,
	Save,
	XCircle,
	Trash2,
	Plus,
} from 'lucide-react';

interface Release {
	_id: string;
	__v: number;
	name: string;
	picture: {
		base64: string;
	} | null;
	artists: {
		order: number;
		artist: number;
		kind: string;
		name: string;
	}[];
	tracks: {
		_id: string;
		order: number;
		track: number;
		name: string;
		isrc: string;
		ISRC: string;
		genre: string;
		subgenre: string;
		track_length: string;
		explicit_content: boolean;
		album_only: boolean;
		generate_isrc: boolean;
		artists: {
			order: number;
			artist: number;
			kind: string;
			name: string;
		}[];
	}[];
	auto_detect_language: boolean;
	backcatalog: boolean;
	countries: string[];
	createdAt: string;
	updatedAt: string;
	dolby_atmos: boolean;
	generate_ean: boolean;
	kind: string;
	label: string;
	language: string;
	youtube_declaration: boolean;
}

interface ArtistData {
	external_id: number;
	name: string;
	role: string;
}

interface UpdateReleaseModalProps {
	release: Release;
	isOpen: boolean;
	onClose: () => void;
	onSave: (updatedRelease: Release) => void;
}

const UpdateReleaseModal: React.FC<UpdateReleaseModalProps> = ({
	release,
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState<Release>({
		...release,
		picture: release.picture ? { base64: release.picture.base64 } : null,
	});
	const [imagePreview, setImagePreview] = useState<string | null>(
		release.picture?.base64
			? `data:image/jpeg;base64,${release.picture.base64}`
			: null
	);
	const [isLoading, setIsLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [artistData, setArtistData] = useState<ArtistData[]>([]);

	useEffect(() => {
		const fetchArtistData = async () => {
			try {
				const response = await fetch('/api/admin/getAllArtists');
				const data = await response.json();
				if (data.success && Array.isArray(data.data)) {
					setArtistData(data.data);
				}
			} catch (error) {
				console.error('Error fetching artist data:', error);
			}
		};

		fetchArtistData();
	}, []);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value, type } = e.target;
		setFormData(prev => ({
			...prev,
			[name]:
				type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
		}));
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
					picture: {
						base64: base64Data,
					},
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			await onSave(formData);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteArtist = (index: number) => {
		setFormData(prev => ({
			...prev,
			artists: prev.artists.filter((_, i) => i !== index),
		}));
	};

	const handleAddArtist = () => {
		setFormData(prev => ({
			...prev,
			artists: [
				...prev.artists,
				{
					order: prev.artists.length,
					artist: 0,
					kind: '',
					name: '',
				},
			],
		}));
	};

	const handleArtistChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newArtists = [...prev.artists];
			if (!newArtists[index]) {
				newArtists[index] = { order: 0, artist: 0, kind: 'main', name: '' };
			}

			if (field === 'artist') {
				const numValue =
					typeof value === 'string' ? parseInt(value) : Number(value);
				if (!isNaN(numValue)) {
					const selectedArtist = artistData.find(
						a => a.external_id === numValue
					);
					if (selectedArtist) {
						newArtists[index] = {
							...newArtists[index],
							artist: selectedArtist.external_id,
							name: selectedArtist.name || '',
						};
					}
				}
			} else if (field === 'kind') {
				newArtists[index] = {
					...newArtists[index],
					kind: value as string,
				};
			} else if (field === 'order') {
				const numValue =
					typeof value === 'string' ? parseInt(value) : Number(value);
				if (!isNaN(numValue)) {
					newArtists[index] = {
						...newArtists[index],
						order: numValue,
					};
				}
			}

			return {
				...prev,
				artists: newArtists,
			};
		});
	};

	const handleDeleteTrack = (index: number) => {
		setFormData(prev => ({
			...prev,
			tracks: prev.tracks.filter((_, i) => i !== index),
		}));
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">Editar Lanzamiento</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full"
					>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700">
							Imagen de portada
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

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Nombre
							</label>
							<input
								type="text"
								name="name"
								value={formData.name}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Label
							</label>
							<input
								type="text"
								name="label"
								value={formData.label}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Idioma
							</label>
							<select
								name="language"
								value={formData.language}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							>
								<option value="ES">Español</option>
								<option value="EN">English</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Tipo
							</label>
							<input
								type="text"
								name="kind"
								value={formData.kind}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700">
							Países
						</label>
						<textarea
							name="countries"
							value={formData.countries.join(', ')}
							onChange={e => {
								const countries = e.target.value.split(',').map(c => c.trim());
								setFormData(prev => ({ ...prev, countries }));
							}}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-dark focus:ring-brand-dark"
							rows={2}
						/>
					</div>

					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700">
							Artistas
						</label>
						<div className="space-y-2">
							{formData.artists.length === 0 ? (
								<div className="flex items-center gap-2">
									<select
										value={formData.artists[0]?.artist ?? ''}
										onChange={e => {
											const value = e.target.value;
											if (value) {
												handleArtistChange(0, 'artist', value);
											}
										}}
										className="flex-1 p-2 border rounded"
									>
										<option value="">Seleccionar artista</option>
										{artistData.map(a => (
											<option key={a.external_id} value={a.external_id}>
												{a.name}
											</option>
										))}
									</select>

									<select
										value={formData.artists[0]?.kind ?? ''}
										onChange={e => {
											handleArtistChange(0, 'kind', e.target.value);
										}}
										className="flex-1 p-2 border rounded"
									>
										<option value="">Seleccionar rol</option>
										<option value="main">Principal</option>
										<option value="featuring">Invitado</option>
										<option value="remixer">Remixer</option>
									</select>

									<input
										type="number"
										value={
											typeof formData.artists[0]?.order === 'number'
												? formData.artists[0].order
												: 0
										}
										onChange={e => {
											const val = parseInt(e.target.value);
											handleArtistChange(0, 'order', isNaN(val) ? 0 : val);
										}}
										className="w-20 p-2 border rounded"
										placeholder="Orden"
									/>
								</div>
							) : (
								formData.artists.map((artist, index) => (
									<div key={index} className="flex items-center gap-2">
										<select
											value={artist.artist ?? ''}
											onChange={e => {
												const value = e.target.value;
												if (value) {
													handleArtistChange(index, 'artist', value);
												}
											}}
											className="flex-1 p-2 border rounded"
										>
											<option value="">Seleccionar artista</option>
											{artistData.map(a => (
												<option key={a.external_id} value={a.external_id}>
													{a.name}
												</option>
											))}
										</select>

										<select
											value={artist.kind ?? ''}
											onChange={e => {
												handleArtistChange(index, 'kind', e.target.value);
											}}
											className="flex-1 p-2 border rounded"
										>
											<option value="">Seleccionar rol</option>
											<option value="main">Principal</option>
											<option value="featuring">Invitado</option>
											<option value="remixer">Remixer</option>
										</select>

										<input
											type="number"
											value={
												typeof artist.order === 'number' ? artist.order : 0
											}
											onChange={e => {
												const val = parseInt(e.target.value);
												handleArtistChange(
													index,
													'order',
													isNaN(val) ? 0 : val
												);
											}}
											className="w-20 p-2 border rounded"
											placeholder="Orden"
										/>

										{formData.artists.length > 1 && (
											<button
												onClick={() => handleDeleteArtist(index)}
												className="p-2 text-red-600 hover:text-red-800"
											>
												<Trash2 size={20} />
											</button>
										)}
									</div>
								))
							)}
						</div>

						<div className="flex justify-end">
							<button
								type="button"
								onClick={handleAddArtist}
								className="p-2 text-brand-light hover:text-brand-dark rounded-full"
							>
								<Plus size={20} />
							</button>
						</div>
					</div>

					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700">
							Tracks
						</label>
						<div className="space-y-2">
							{formData.tracks.map((track, index) => (
								<div
									key={track._id || index}
									className="p-3 bg-gray-50 rounded-lg"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">
													{track.name}
												</span>
												<span className="text-xs text-gray-500">
													Orden: {track.order}
												</span>
											</div>

											{track.artists && track.artists.length > 0 && (
												<div className="mt-1">
													<div className="text-xs text-gray-500 mb-1">
														Artistas:
													</div>
													<div className="space-y-1">
														{track.artists.map((artist: any) => (
															<div
																key={artist._id}
																className="flex items-center gap-2 text-xs"
															>
																<span className="bg-gray-200 px-2 py-0.5 rounded">
																	{artist.kind === 'main'
																		? 'Principal'
																		: artist.kind === 'featuring'
																		? 'Invitado'
																		: artist.kind === 'remixer'
																		? 'Remixer'
																		: artist.kind}
																</span>
																<span>ID: {artist.artist}</span>
															</div>
														))}
													</div>
												</div>
											)}

											<div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
												<div>
													<span className="font-medium">ISRC:</span>{' '}
													{track.ISRC || 'No asignado'}
												</div>
												<div>
													<span className="font-medium">Duración:</span>{' '}
													{track.track_length || '00:00:00'}
												</div>
												<div>
													<span className="font-medium">Género:</span>{' '}
													{track.genre}
												</div>
												<div>
													<span className="font-medium">Subgénero:</span>{' '}
													{track.subgenre}
												</div>
											</div>

											<div className="mt-2 flex flex-wrap gap-2">
												{track.album_only && (
													<span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
														Solo álbum
													</span>
												)}
												{track.explicit_content && (
													<span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
														Contenido explícito
													</span>
												)}
												{track.generate_isrc && (
													<span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
														ISRC automático
													</span>
												)}
											</div>
										</div>
										<button
											type="button"
											onClick={() => handleDeleteTrack(index)}
											className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							))}
							{formData.tracks.length === 0 && (
								<div className="text-sm text-gray-500 italic">
									No hay tracks agregados
								</div>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="flex items-center">
							<input
								type="checkbox"
								name="auto_detect_language"
								checked={formData.auto_detect_language}
								onChange={handleChange}
								className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
							/>
							<label className="ml-2 block text-sm text-gray-700">
								Detectar idioma automáticamente
							</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								name="backcatalog"
								checked={formData.backcatalog}
								onChange={handleChange}
								className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
							/>
							<label className="ml-2 block text-sm text-gray-700">
								Backcatalog
							</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								name="dolby_atmos"
								checked={formData.dolby_atmos}
								onChange={handleChange}
								className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
							/>
							<label className="ml-2 block text-sm text-gray-700">
								Dolby Atmos
							</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								name="generate_ean"
								checked={formData.generate_ean}
								onChange={handleChange}
								className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
							/>
							<label className="ml-2 block text-sm text-gray-700">
								Generar EAN
							</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								name="youtube_declaration"
								checked={formData.youtube_declaration}
								onChange={handleChange}
								className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
							/>
							<label className="ml-2 block text-sm text-gray-700">
								Declaración de YouTube
							</label>
						</div>
					</div>

					<div className="text-sm text-gray-500 mt-4">
						<p>Creado: {new Date(formData.createdAt).toLocaleString()}</p>
						<p>Actualizado: {new Date(formData.updatedAt).toLocaleString()}</p>
					</div>

					<div className="flex justify-end space-x-3 mt-6">
						<button
							type="button"
							onClick={onClose}
							disabled={isLoading}
							className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
							<span className="group-hover:text-brand-dark">Cancelar</span>
						</button>
						<button
							type="submit"
							disabled={isLoading}
							className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
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

export default UpdateReleaseModal;
