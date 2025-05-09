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
import Cleave from 'cleave.js';
import Select, { SingleValue } from 'react-select';

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
	track_length: string;
}

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

	const handleTrackChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newTracks = [...prev.tracks];
			if (!newTracks[index]) {
				newTracks[index] = {
					_id: '',
					order: prev.tracks.length,
					track: 0,
					name: '',
					isrc: '',
					ISRC: '',
					genre: '',
					subgenre: '',
					track_length: '',
					explicit_content: false,
					album_only: false,
					generate_isrc: false,
					artists: [],
				};
			}

			if (field === 'track') {
				const numValue =
					typeof value === 'string' ? parseInt(value) : Number(value);
				if (!isNaN(numValue)) {
					const selectedTrack = trackData.find(t => t._id === value);
					if (selectedTrack) {
						newTracks[index] = {
							...newTracks[index],
							track: numValue,
							name: selectedTrack.name,
							ISRC: selectedTrack.ISRC,
							order: prev.tracks.length,
						};
					}
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
				...prev.tracks,
				{
					_id: '',
					order: prev.tracks.length,
					track: 0,
					name: '',
					isrc: '',
					ISRC: '',
					genre: '',
					subgenre: '',
					track_length: '',
					explicit_content: false,
					album_only: false,
					generate_isrc: false,
					artists: [],
				},
			],
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
									value: formData.language,
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
									<Select
										value={
											formData.artists[0]?.artist
												? {
														value: formData.artists[0].artist,
														label: formData.artists[0].name,
												  }
												: null
										}
										onChange={(
											selectedOption: SingleValue<{
												value: number;
												label: string;
											}>
										) => {
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

									<Select
										value={
											formData.artists[0]?.kind
												? {
														value: formData.artists[0].kind,
														label:
															formData.artists[0].kind === 'main'
																? 'Principal'
																: formData.artists[0].kind === 'featuring'
																? 'Invitado'
																: 'Remixer',
												  }
												: null
										}
										onChange={(
											selectedOption: SingleValue<{
												value: string;
												label: string;
											}>
										) => {
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
											typeof formData.artists[0]?.order === 'number'
												? formData.artists[0].order
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
								formData.artists.map((artist, index) => (
									<div key={index} className="flex items-center gap-2">
										<Select
											value={
												artist.artist
													? {
															value: artist.artist,
															label: artist.name,
													  }
													: null
											}
											onChange={(
												selectedOption: SingleValue<{
													value: number;
													label: string;
												}>
											) => {
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

										<Select
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
													: null
											}
											onChange={(
												selectedOption: SingleValue<{
													value: string;
													label: string;
												}>
											) => {
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
											className="w-20 px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
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
									className="flex items-center gap-2"
								>
									<div className="flex-1 p-2 border rounded bg-gray-50">
										{track.name}
									</div>

									<button
										onClick={() => handleDeleteTrack(index)}
										className="p-2 text-red-600 hover:text-red-800"
									>
										<Trash2 size={20} />
									</button>
								</div>
							))}

							{formData.tracks.length === 0 && (
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
													formData.tracks.length,
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
