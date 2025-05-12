import React, { useState, useRef, useEffect } from 'react';
import {
	Upload,
	Image as ImageIcon,
	Save,
	XCircle,
	Trash2,
	Plus,
	ArrowBigUp,
	Play,
	Pause,
	Music,
	User,
} from 'lucide-react';
import Select, { SingleValue } from 'react-select';
import { Release, Artist } from '@/types/release';
import UploadTrackToRelease from './UploadTrackToRelease';
import { useRouter } from 'next/navigation';

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
	formData: Release;
	setFormData: React.Dispatch<React.SetStateAction<Release>>;
}

interface ArtistOption {
	value: number;
	label: string;
}

interface KindOption {
	value: string;
	label: string;
}

interface LabelOption {
	value: number;
	label: string;
}

const RELEASE_TYPES: KindOption[] = [
	{ value: 'single', label: 'Single' },
	{ value: 'ep', label: 'EP' },
	{ value: 'album', label: 'Album' },
];

const CustomSwitch: React.FC<{
	checked: boolean;
	onChange: (checked: boolean) => void;
	className?: string;
}> = ({ checked, onChange, className = '' }) => (
	<button
		type="button"
		role="switch"
		aria-checked={checked}
		tabIndex={0}
		onClick={() => onChange(!checked)}
		className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex items-center ${
			checked ? 'bg-brand-light' : 'bg-gray-700'
		} ${className}`}
	>
		{/* Línea blanca solo cuando está encendido */}
		{checked && (
			<span className="absolute left-1.5 w-px h-1.5 bg-white rounded-sm z-10"></span>
		)}
		{/* Círculo de la derecha (ring) solo cuando está apagado */}
		{!checked && (
			<span className="absolute right-1 top-1.1 w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-transparent z-10"></span>
		)}
		{/* Círculo principal */}
		<span
			className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 z-20 ${
				checked ? 'translate-x-4' : ''
			} ${checked ? '' : 'border-2 border-gray-300'}`}
		></span>
	</button>
);

const UpdateReleasePage: React.FC<UpdateReleasePageProps> = ({
	release,
	onSave,
	formData,
	setFormData,
}) => {
	console.log('Release completo:', release);

	const router = useRouter();
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<{
		total: number;
		loaded: number;
		percentage: number;
	} | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [uploadedTracks, setUploadedTracks] = useState<
		{ title: string; mixName: string; file: File }[]
	>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [artistData, setArtistData] = useState<ArtistData[]>([]);
	const [trackData, setTrackData] = useState<TrackData[]>([]);
	const [trackDetails, setTrackDetails] = useState<{ [key: string]: any }>({});
	const [playingTrack, setPlayingTrack] = useState<string | null>(null);
	const [playList, setPlayList] = useState<any[]>([]);
	const [progress, setProgress] = useState<number>(0);
	const [labels, setLabels] = useState<LabelOption[]>([]);
	const audioRef = useRef<HTMLAudioElement | null>(null);

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

				// Fetch labels
				const labelsRes = await fetch('/api/admin/getAllSellos');
				const labelsData = await labelsRes.json();
				if (labelsData.success && Array.isArray(labelsData.data)) {
					setLabels(
						labelsData.data.map((label: any) => ({
							value: label._id,
							label: label.name,
						}))
					);
				}

				// Actualizar los tracks del release
				setFormData(prev => {
					if (!prev) return prev;
					return {
						...prev,
						tracks: release.tracks || [],
					};
				});
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};

		fetchData();
	}, [release._id, release.tracks]);

	useEffect(() => {
		if (release.tracks) {
			const tracks = release.tracks.map((track, index) => {
				// Asegurarnos que la URL sea absoluta
				const trackUrl = track.resource.startsWith('http')
					? track.resource
					: `${window.location.origin}${track.resource}`;

				console.log('Track URL:', trackUrl);

				return {
					name: track.title || 'Track sin nombre',
					writer: track.mix_name || '',
					img: '',
					src: trackUrl,
					id: index.toString(),
				};
			});
			console.log('Playlist completa:', tracks);
			setPlayList(tracks);
		}
	}, [release.tracks]);

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
		console.log('Tracks al enviar:', formData.tracks);
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

	const handleArtistChange = (selectedOptions: any) => {
		setFormData(prev => ({
			...prev,
			artists: selectedOptions.map((option: any) => ({
				order: 0,
				artist: option.value,
				kind: 'main',
				name: option.label,
			})),
		}));
	};

	const handleDeleteTrack = (index: number) => {
		setFormData(prev => ({
			...prev,
			tracks: prev.tracks?.filter((_, i) => i !== index) || [],
		}));
	};

	const handleTrackChange = (trackId: number, field: string, value: any) => {
		setFormData(prev => ({
			...prev,
			tracks:
				prev.tracks?.map(track =>
					track.order === trackId ? { ...track, [field]: value } : track
				) || [],
		}));
	};

	const handleAddTrack = () => {
		setFormData(prev => ({
			...prev,
			tracks: [
				...(prev.tracks || []),
				{
					order: (prev.tracks || []).length,
					title: '',
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

	const handleUploadProgress = (progress: {
		total: number;
		loaded: number;
		percentage: number;
	}) => {
		setUploadProgress(progress);
	};

	const handleUploadComplete = async (
		tracks: { title: string; mixName: string; file: File }[]
	) => {
		try {
			// Actualizar el estado local con los tracks subidos
			setFormData(prev => ({
				...prev,
				tracks: [
					...(prev.tracks || []),
					...tracks.map(track => ({
						order: (prev.tracks || []).length + 1,
						title: track.title,
						mix_name: track.mixName,
						artists: [],
						ISRC: '',
						generate_isrc: false,
						DA_ISRC: '',
						genre: 0,
						subgenre: 0,
						resource: '',
						dolby_atmos_resource: '',
						album_only: false,
						explicit_content: false,
						track_length: '',
					})),
				],
			}));

			// Limpiar el estado de subida
			setUploadedTracks([]);
			// Cerrar el modal
			setIsUploadModalOpen(false);

			// Iniciamos el procesamiento justo antes del fetch
			setIsProcessing(true);

			// Fetch para obtener los tracks actualizados
			const response = await fetch(`/api/admin/getRelease/${release._id}`);
			const data = await response.json();

			if (data.success) {
				setFormData(prev => ({
					...prev,
					tracks: data.data.tracks || [],
				}));
			}
		} catch (error) {
			console.error('Error al actualizar los tracks:', error);
		} finally {
			setIsProcessing(false);
			setUploadProgress(null);
		}
	};

	const handlePlayPause = (trackIndex: number, resource: string) => {
		if (playingTrack === trackIndex.toString()) {
			// Pausar
			audioRef.current?.pause();
			setPlayingTrack(null);
			setProgress(0);
		} else {
			// Reproducir
			if (audioRef.current) {
				audioRef.current.src = resource;
				audioRef.current.play();
				setPlayingTrack(trackIndex.toString());
				setProgress(0);
			}
		}
	};

	// Efecto para manejar el final de la reproducción y el progreso
	useEffect(() => {
		const audio = audioRef.current;
		if (audio) {
			const handleEnded = () => {
				setPlayingTrack(null);
				setProgress(0);
			};

			const handleTimeUpdate = () => {
				if (audio.duration) {
					const currentProgress = (audio.currentTime / audio.duration) * 100;
					setProgress(currentProgress);
				}
			};

			audio.addEventListener('ended', handleEnded);
			audio.addEventListener('timeupdate', handleTimeUpdate);
			return () => {
				audio.removeEventListener('ended', handleEnded);
				audio.removeEventListener('timeupdate', handleTimeUpdate);
			};
		}
	}, []);

	return (
		<div className="container mx-auto px-4 py-8">
			<audio ref={audioRef} />
			<div className="bg-white rounded-lg p-6">
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2 bg-slate-50 p-2">
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
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700">
							Tracks
						</label>
						<div className="space-y-2">
							{release.tracks?.map((track, index) => {
								console.log('Track del release:', track);
								return (
									<div
										key={index}
										className="flex items-center gap-4 group hover:bg-gray-50 transition-colors duration-200 rounded-lg p-3"
									>
										<div className="flex flex-col items-center gap-2">
											<div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
												<Music size={40} className="text-gray-400" />
											</div>
											<button
												onClick={() => handlePlayPause(index, track.resource)}
												className="p-2 text-brand-light hover:text-brand-dark transition-opacity duration-200 bg-white rounded-full shadow-sm hover:shadow-md"
											>
												{playingTrack === index.toString() ? (
													<Pause size={16} />
												) : (
													<Play size={16} />
												)}
											</button>
										</div>
										<div className="flex-1">
											<div className="text-xl text-brand-dark font-medium">
												{track.title || 'Track sin nombre'}
											</div>
											{playingTrack === index.toString() && (
												<div className="mt-2 w-full bg-gray-200 rounded-full h-1">
													<div
														className="bg-brand-light h-1 rounded-full transition-all duration-300"
														style={{ width: `${progress}%` }}
													></div>
												</div>
											)}
											<div className="text-sm text-gray-500 space-y-1">
												{track.ISRC && <div>ISRC: {track.ISRC}</div>}
												{track.mix_name && <div>Mix: {track.mix_name}</div>}
												{track.resource && (
													<div className="text-[9px] truncate">
														Resource: {track.resource}
													</div>
												)}
												{track.dolby_atmos_resource && (
													<div>Dolby: {track.dolby_atmos_resource}</div>
												)}
												{track.track_length && (
													<div>Duración: {track.track_length}</div>
												)}
											</div>
										</div>
										<button
											onClick={() => handleDeleteTrack(index)}
											className="p-3 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
										>
											<Trash2 size={20} />
										</button>
									</div>
								);
							})}

							{uploadedTracks.map((track, index) => (
								<div
									key={`uploaded-${index}`}
									className="flex items-center gap-2"
								>
									<div className="flex-1 p-2 border rounded bg-gray-50">
										{track.title} {track.mixName ? `(${track.mixName})` : ''}
									</div>
									<button
										onClick={() => {
											setUploadedTracks(prev =>
												prev.filter((_, i) => i !== index)
											);
										}}
										className="p-2 text-red-600 hover:text-red-800"
									>
										<Trash2 size={20} />
									</button>
								</div>
							))}

							{(!release.tracks || release.tracks.length === 0) &&
								uploadedTracks.length === 0 && (
									<div className="text-sm text-gray-500">
										No hay tracks agregados
									</div>
								)}

							{(uploadProgress || isProcessing) && (
								<div className="mt-2">
									{uploadProgress && !isProcessing && (
										<div className="w-full bg-gray-200 rounded-full h-2.5">
											<div
												className="bg-brand-light h-2.5 rounded-full transition-all duration-300"
												style={{ width: `${uploadProgress.percentage}%` }}
											></div>
										</div>
									)}
									<p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
										{isProcessing ? (
											<>
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-light border-t-transparent" />
												<span>Procesando track...</span>
											</>
										) : (
											`Subiendo... ${uploadProgress?.percentage}%`
										)}
									</p>
								</div>
							)}
						</div>

						<div className="flex justify-end">
							<button
								type="button"
								onClick={() => setIsUploadModalOpen(true)}
								className="p-2 text-brand-light hover:text-brand-dark rounded-full"
							>
								<Plus size={20} />
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
							<Select
								value={labels.find(label => label.value === formData.label)}
								onChange={(selectedOption: SingleValue<LabelOption>) => {
									if (selectedOption) {
										setFormData(prev => ({
											...prev,
											label: selectedOption.value,
											label_name: selectedOption.label,
										}));
									}
								}}
								options={labels}
								placeholder="Seleccionar label"
								className="react-select-container"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
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
							<Select
								value={RELEASE_TYPES.find(type => type.value === formData.kind)}
								onChange={(selectedOption: SingleValue<KindOption>) => {
									if (selectedOption) {
										setFormData(prev => ({
											...prev,
											kind: selectedOption.value,
										}));
									}
								}}
								options={RELEASE_TYPES}
								placeholder="Seleccionar tipo"
								className="react-select-container"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
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
						<div className="space-y-4 flex flex-col p-2 bg-slate-100">
							<Select<ArtistOption>
								value={null}
								onChange={(selectedOption: SingleValue<ArtistOption>) => {
									if (selectedOption) {
										setFormData(prev => ({
											...prev,
											artists: [
												...(prev.artists || []),
												{
													order: (prev.artists || []).length,
													artist: selectedOption.value,
													kind: 'main',
													name: selectedOption.label,
												},
											],
										}));
									}
								}}
								options={artistData.map(artist => ({
									value: artist.external_id,
									label: artist.name,
								}))}
								placeholder={
									<div className="flex items-center gap-2">
										<Plus className="w-4 h-4" />
										<span>Seleccionar artista</span>
									</div>
								}
								className="react-select-container w-72 self-end"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
							/>

							<div className=" space-y-2   min-h-52 p-2">
								<div className=" flex flex-wrap gap-2 items-center">
									{(formData.artists || []).map((artist, index) => (
										<div
											key={index}
											className="flex items-start justify-between p-3 bg-gray-50 w-60 rounded-lg"
										>
											<div className="flex  gap-3">
												<div className="p-2 bg-white rounded-full">
													<User className="w-14 h-14 text-gray-600" />
												</div>
												<div className="flex flex-col items-center">
													<span className="font-medium ">{artist.name}</span>
													<CustomSwitch
														checked={artist.kind === 'main'}
														onChange={checked => {
															setFormData(prev => ({
																...prev,
																artists: (prev.artists || []).map((a, i) =>
																	i === index
																		? {
																				...a,
																				kind: checked ? 'main' : 'featuring',
																		  }
																		: a
																),
															}));
														}}
														className="mx-auto my-1"
													/>
													<span className="ml-2 text-xs text-gray-600">
														{artist.kind === 'main' ? 'Principal' : 'Invitado'}
													</span>
												</div>
											</div>
											<button
												onClick={() => handleDeleteArtist(index)}
												className="p-2 text-gray-400 hover:text-red-600 transition-colors"
											>
												<Trash2 size={20} />
											</button>
										</div>
									))}
								</div>
							</div>
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
				releaseId={release._id}
				onUploadProgress={handleUploadProgress}
				onUploadComplete={handleUploadComplete}
			/>
		</div>
	);
};

export default UpdateReleasePage;
