import React, { useState, useRef, useEffect } from 'react';
import {
	Upload,
	Image as ImageIcon,
	Save,
	XCircle,
	Trash2,
	Plus,
	ArrowBigUp,
} from 'lucide-react';
import Select, { SingleValue } from 'react-select';
import { Release, Artist } from '@/types/release';
import UploadTrackToRelease from './UploadTrackToRelease';

interface ArtistData {
	external_id: number;
	name: string;
	role: string;
}

interface TrackData {
	_id: string;
	name: string;
	ISRC: string;
}

interface UpdateReleasePageProps {
	release: Release;
	onSave: (updatedRelease: Release) => Promise<void>;
}

interface ArtistOption {
	value: number;
	label: string;
}

interface KindOption {
	value: string;
	label: string;
}

const UpdateReleasePage: React.FC<UpdateReleasePageProps> = ({
	release,
	onSave,
}) => {
	const [formData, setFormData] = useState<Release>(() => ({
		...release,
		picture: release.picture || undefined,
		artists: release.artists || [],
		tracks: (release.tracks || []).filter(track => track !== null),
		countries: release.countries || [],
		createdAt: release.createdAt || new Date().toISOString(),
		updatedAt: release.updatedAt || new Date().toISOString(),
	}));
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [artistData, setArtistData] = useState<ArtistData[]>([]);
	const [trackData, setTrackData] = useState<TrackData[]>([]);

	// Add the common input styles at the top of the component
	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';
	const selectStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent appearance-none cursor-pointer relative pr-8';
	const selectWrapperStyles = 'relative';

	// Add the react-select styles
	const reactSelectStyles = {
		control: (base: any) => ({
			...base,
			border: 'none',
			borderBottom: '2px solid #E5E7EB',
			borderRadius: '0',
			boxShadow: 'none',
			'&:hover': {
				borderBottom: '2px solid #4B5563',
			},
		}),
		option: (base: any, state: any) => ({
			...base,
			backgroundColor: state.isSelected
				? '#4B5563'
				: state.isFocused
				? '#F3F4F6'
				: 'white',
			color: state.isSelected ? 'white' : '#1F2937',
			'&:hover': {
				backgroundColor: state.isSelected ? '#4B5563' : '#F3F4F6',
			},
		}),
		menu: (base: any) => ({
			...base,
			zIndex: 9999,
		}),
	};

	// Efecto para cargar la imagen inicial
	useEffect(() => {
		if (release.picture) {
			// Si la imagen es una URL, la usamos directamente
			if (release.picture.startsWith('http')) {
				setImagePreview(release.picture);
			} else {
				// Si es base64, la convertimos a URL
				setImagePreview(`data:image/jpeg;base64,${release.picture}`);
			}
		}
	}, [release.picture]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch artists
				const artistsRes = await fetch('/api/admin/getAllArtists');
				const artistsData = await artistsRes.json();
				if (artistsData.success && Array.isArray(artistsData.data)) {
					setArtistData(artistsData.data);
				}

				// Fetch tracks
				const tracksRes = await fetch('/api/admin/getAllTracks');
				const tracksData = await tracksRes.json();
				console.log(tracksData);
				setTrackData(tracksData.singleTracks);
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};

		fetchData();
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
				// Mostramos el preview de la imagen subida
				setImagePreview(base64String);
				// Guardamos solo la parte base64 sin el prefijo
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
		setIsLoading(true);
		console.log('enviado: ', formData);
		try {
			await onSave(formData);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteArtist = (index: number) => {
		setFormData(prev => ({
			...prev,
			artists: prev.artists?.filter((_, i) => i !== index) || [],
		}));
	};

	const handleAddArtist = () => {
		setFormData(prev => ({
			...prev,
			artists: [
				...(prev.artists || []),
				{
					order: prev.artists?.length || 0,
					artist: 0,
					kind: '',
					name: '',
				},
			],
		}));
	};

	const handleArtistChange = (
		index: number,
		field: keyof Artist,
		value: string | number
	) => {
		setFormData(prev => {
			const artists = [...(prev.artists || [])];
			if (!artists[index]) {
				artists[index] = {
					artist: 0,
					name: '',
					kind: 'main',
					order: 0,
				};
			}
			artists[index] = {
				...artists[index],
				[field]: value,
			};
			return { ...prev, artists };
		});
	};

	const handleDeleteTrack = (index: number) => {
		setFormData(prev => ({
			...prev,
			tracks: prev.tracks?.filter((_, i) => i !== index) || [],
		}));
	};

	const handleTrackChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newTracks = [...(prev.tracks || [])];
			if (!newTracks[index]) {
				newTracks[index] = {
					order: (prev.tracks || []).length,
					name: '',
					artists: [],
					ISRC: '',
					generate_isrc: false,
					DA_ISRC: '',
					genre: 0,
					subgenre: 0,
					mix_name: '',
					resource: '',
					dolby_atmos_resource: '',
					album_only: false,
					explicit_content: false,
					track_length: '',
				};
			}

			if (field === 'track') {
				const selectedTrack = trackData.find(t => t._id === value);
				if (selectedTrack) {
					newTracks[index] = {
						...newTracks[index],
						name: selectedTrack.name,
						ISRC: selectedTrack.ISRC,
						order: (prev.tracks || []).length,
					};
				}
			} else if (field === 'order') {
				const numValue =
					typeof value === 'string' ? parseInt(value) : Number(value);
				if (!isNaN(numValue)) {
					newTracks[index] = {
						...newTracks[index],
						order: numValue,
					};
				}
			}

			return {
				...prev,
				tracks: newTracks,
			};
		});
	};

	const handleAddTrack = () => {
		setFormData(prev => ({
			...prev,
			tracks: [
				...(prev.tracks || []),
				{
					order: (prev.tracks || []).length,
					name: '',
					artists: [],
					ISRC: '',
					generate_isrc: false,
					DA_ISRC: '',
					genre: 0,
					subgenre: 0,
					mix_name: '',
					resource: '',
					dolby_atmos_resource: '',
					album_only: false,
					explicit_content: false,
					track_length: '',
				},
			],
		}));
	};

	const handleUploadTrack = (data: {
		title: string;
		mixName: string;
		file: File;
	}) => {
		console.log('Track data:', data);
		// Aquí irá la lógica para subir el track
		setIsUploadModalOpen(false);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="bg-white rounded-lg p-6">
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2 bg-slate-50">
						<div className="flex items-center gap-4">
							<div className="w-52 h-52 border-2 border-gray-200 flex items-center justify-center overflow-hidden relative group">
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
								<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-end justify-center p-2">
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
										className="inline-flex items-center px-3 py-2 border border-white shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-gray-700 transition-all duration-200"
									>
										<Upload className="h-4 w-4 mr-2" />
										Cambiar imagen
									</button>
								</div>
							</div>
						</div>
						<div className="flex justify-end border-t border-gray-300 mt-4">
							<button
								type="button"
								onClick={() => setIsUploadModalOpen(true)}
								className="inline-flex items-center text-brand-light px-4 py-2 text-sm font-medium hover:text-gray-900 transition-colors duration-200"
							>
								<ArrowBigUp className="h-6 w-6 mr-2 fill-current" />
								Subir track
							</button>
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
								className={inputStyles}
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
								className={inputStyles}
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Idioma
							</label>
							<Select
								name="language"
								value={{
									value: formData.language || '',
									label: formData.language === 'ES' ? 'Español' : 'English',
								}}
								onChange={(
									selectedOption: SingleValue<{ value: string; label: string }>
								) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'language',
												value: selectedOption.value,
											},
										} as any);
									}
								}}
								options={[
									{ value: 'ES', label: 'Español' },
									{ value: 'EN', label: 'English' },
								]}
								className="react-select-container"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
							/>
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
								className={inputStyles}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700">
							Países
						</label>
						<textarea
							name="countries"
							value={(formData.countries || []).join(', ')}
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
							{(formData.artists || []).length === 0 ? (
								<div className="flex items-center gap-2">
									<Select<ArtistOption>
										value={
											(formData.artists || [])[0]?.artist
												? {
														value: (formData.artists || [])[0].artist,
														label: (formData.artists || [])[0].name || '',
												  }
												: { value: 0, label: '' }
										}
										onChange={(selectedOption: SingleValue<ArtistOption>) => {
											if (selectedOption) {
												handleArtistChange(0, 'artist', selectedOption.value);
											}
										}}
										options={artistData.map(artist => ({
											value: artist.external_id,
											label: artist.name,
										}))}
										placeholder="Seleccionar artista"
										className="react-select-container flex-1"
										classNamePrefix="react-select"
										styles={reactSelectStyles}
									/>

									<Select<KindOption>
										value={
											(formData.artists || [])[0]?.kind
												? {
														value: (formData.artists || [])[0].kind,
														label:
															(formData.artists || [])[0].kind === 'main'
																? 'Principal'
																: (formData.artists || [])[0].kind ===
																  'featuring'
																? 'Invitado'
																: 'Remixer',
												  }
												: { value: 'main', label: 'Principal' }
										}
										onChange={(selectedOption: SingleValue<KindOption>) => {
											if (selectedOption) {
												handleArtistChange(0, 'kind', selectedOption.value);
											}
										}}
										options={[
											{ value: 'main', label: 'Principal' },
											{ value: 'featuring', label: 'Invitado' },
											{ value: 'remixer', label: 'Remixer' },
										]}
										placeholder="Seleccionar rol"
										className="react-select-container flex-1"
										classNamePrefix="react-select"
										styles={reactSelectStyles}
									/>

									<input
										type="number"
										value={
											typeof (formData.artists || [])[0]?.order === 'number'
												? (formData.artists || [])[0].order
												: 0
										}
										onChange={e => {
											const val = parseInt(e.target.value);
											handleArtistChange(0, 'order', isNaN(val) ? 0 : val);
										}}
										className={inputStyles}
										placeholder="Orden"
									/>
								</div>
							) : (
								(formData.artists || []).map((artist, index) => (
									<div key={index} className="flex items-center gap-2">
										<Select<ArtistOption>
											value={
												artist.artist
													? {
															value: artist.artist,
															label: artist.name || '',
													  }
													: { value: 0, label: '' }
											}
											onChange={(selectedOption: SingleValue<ArtistOption>) => {
												if (selectedOption) {
													handleArtistChange(
														index,
														'artist',
														selectedOption.value
													);
												}
											}}
											options={artistData.map(artist => ({
												value: artist.external_id,
												label: artist.name,
											}))}
											placeholder="Seleccionar artista"
											className="react-select-container flex-1"
											classNamePrefix="react-select"
											styles={reactSelectStyles}
										/>

										<Select<KindOption>
											value={
												artist.kind
													? {
															value: artist.kind,
															label:
																artist.kind === 'main'
																	? 'Principal'
																	: artist.kind === 'featuring'
																	? 'Invitado'
																	: 'Remixer',
													  }
													: { value: 'main', label: 'Principal' }
											}
											onChange={(selectedOption: SingleValue<KindOption>) => {
												if (selectedOption) {
													handleArtistChange(
														index,
														'kind',
														selectedOption.value
													);
												}
											}}
											options={[
												{ value: 'main', label: 'Principal' },
												{ value: 'featuring', label: 'Invitado' },
												{ value: 'remixer', label: 'Remixer' },
											]}
											placeholder="Seleccionar rol"
											className="react-select-container flex-1"
											classNamePrefix="react-select"
											styles={reactSelectStyles}
										/>

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
											className={inputStyles}
											placeholder="Orden"
										/>

										{(formData.artists || []).length > 1 && (
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
							{formData.tracks
								?.filter(track => track !== null)
								.map((track, index) => (
									<div key={index} className="flex items-center gap-2">
										<div className="flex-1 p-2 border rounded bg-gray-50">
											{track?.name || 'Track sin nombre'}
										</div>
										<button
											onClick={() => handleDeleteTrack(index)}
											className="p-2 text-red-600 hover:text-red-800"
										>
											<Trash2 size={20} />
										</button>
									</div>
								))}

							{(!formData.tracks || formData.tracks.length === 0) && (
								<div className="text-sm text-gray-500">
									No hay tracks agregados
								</div>
							)}

							<div className="flex items-center gap-2">
								<Select
									value={null}
									onChange={(
										selectedOption: SingleValue<{
											value: string;
											label: string;
										}>
									) => {
										if (selectedOption) {
											const selectedTrack = trackData.find(
												t => t._id === selectedOption.value
											);
											if (selectedTrack) {
												handleTrackChange(
													(formData.tracks || []).length,
													'track',
													selectedTrack._id
												);
											}
										}
									}}
									options={trackData.map(track => ({
										value: track._id,
										label: track.name,
									}))}
									placeholder="Seleccionar track"
									className="react-select-container flex-1"
									classNamePrefix="react-select"
									styles={reactSelectStyles}
								/>
							</div>
						</div>

						<div className="flex justify-end">
							<button
								type="button"
								onClick={handleAddTrack}
								className="p-2 text-brand-light hover:text-brand-dark rounded-full"
							>
								<Plus size={20} />
							</button>
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

					<div className="flex justify-end space-x-3 mt-6">
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

			<UploadTrackToRelease
				isOpen={isUploadModalOpen}
				onClose={() => setIsUploadModalOpen(false)}
				onSubmit={handleUploadTrack}
				releaseId={release._id}
			/>
		</div>
	);
};

export default UpdateReleasePage;
