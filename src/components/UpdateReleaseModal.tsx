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
	Pencil,
	ChevronDown,
	Link,
} from 'lucide-react';
import Select, { SingleValue } from 'react-select';
import { Release, Artist } from '@/types/release';
import UploadTrackToRelease from './UploadTrackToRelease';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TrackForm from './CreateTrackModal';
import { Track } from '@/types/track';
import { toast } from 'react-hot-toast';

interface ArtistData {
	external_id: number;
	name: string;
	role: string;
}

interface TrackData {
	_id: string;
	name: string;
	mix_name?: string;
	DA_ISRC?: string;
	ISRC?: string;
	__v: number;
	album_only: boolean;
	artists: Array<{
		artist: number;
		kind: string;
		order: number;
		name: string;
	}>;
	contributors: Array<{
		contributor: number;
		name: string;
		role: number;
		order: number;
		role_name: string;
	}>;
	copyright_holder?: string;
	copyright_holder_year?: string;
	createdAt: string;
	dolby_atmos_resource?: string;
	explicit_content: boolean;
	generate_isrc: boolean;
	genre?: {
		id: number;
		name: string;
	};
	subgenre?: {
		id: number;
		name: string;
	};
	label_share?: number;
	language?: string;
	order?: number;
	publishers: Array<{
		publisher: number;
		author: string;
		order: number;
	}>;
	release?: string;
	resource?: File | string | null;
	sample_start?: string;
	track_lenght?: string;
	updatedAt: string;
	vocals?: string;
}

interface NewArtist {
	order: number;
	artist: number;
	kind: string;
	name: string;
	email: string;
	amazon_music_identifier: string;
	apple_identifier: string;
	deezer_identifier: string;
	spotify_identifier: string;
}

interface ReleaseTrack {
	external_id?: string;
	order: number;
	title: string;
	artists: Artist[];
	ISRC: string;
	generate_isrc: boolean;
	DA_ISRC: string;
	genre: number;
	genre_name: string;
	subgenre: number;
	subgenre_name: string;
	mix_name: string;
	resource: string;
	dolby_atmos_resource: string;
	album_only: boolean;
	explicit_content: boolean;
	track_length: string;
}

interface UpdateReleasePageProps {
	release: Release;
	onSave: (updatedRelease: Release) => void;
	formData: Release;
	setFormData: React.Dispatch<React.SetStateAction<Release>>;
	onEditTrack: (track: any) => void;
	genres: GenreData[];
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

interface GenreData {
	id: number;
	name: string;
	subgenres: Array<{
		id: number;
		name: string;
	}>;
}

interface SubgenreOption {
	value: number;
	label: string;
}

interface PublisherOption {
	value: number;
	label: string;
}

interface CountryOption {
	value: string;
	label: string;
}

const RELEASE_TYPES: KindOption[] = [
	{ value: 'single', label: 'Single' },
	{ value: 'ep', label: 'EP' },
	{ value: 'album', label: 'Album' },
];

const RELEVANT_COUNTRIES: CountryOption[] = [
	{ value: 'US', label: 'United States' },
	{ value: 'GB', label: 'United Kingdom' },
	{ value: 'ES', label: 'Spain' },
	{ value: 'MX', label: 'Mexico' },
	{ value: 'AR', label: 'Argentina' },
	{ value: 'BR', label: 'Brazil' },
	{ value: 'CO', label: 'Colombia' },
	{ value: 'CL', label: 'Chile' },
	{ value: 'PE', label: 'Peru' },
	{ value: 'EC', label: 'Ecuador' },
	{ value: 'VE', label: 'Venezuela' },
	{ value: 'UY', label: 'Uruguay' },
	{ value: 'PY', label: 'Paraguay' },
	{ value: 'BO', label: 'Bolivia' },
	{ value: 'DE', label: 'Germany' },
	{ value: 'FR', label: 'France' },
	{ value: 'IT', label: 'Italy' },
	{ value: 'PT', label: 'Portugal' },
	{ value: 'CA', label: 'Canada' },
	{ value: 'AU', label: 'Australia' },
	{ value: 'NZ', label: 'New Zealand' },
	{ value: 'JP', label: 'Japan' },
	{ value: 'KR', label: 'South Korea' },
	{ value: 'CN', label: 'China' },
	{ value: 'IN', label: 'India' },
	{ value: 'RU', label: 'Russia' },
	{ value: 'SE', label: 'Sweden' },
	{ value: 'NO', label: 'Norway' },
	{ value: 'DK', label: 'Denmark' },
	{ value: 'FI', label: 'Finland' },
	{ value: 'NL', label: 'Netherlands' },
	{ value: 'BE', label: 'Belgium' },
	{ value: 'CH', label: 'Switzerland' },
	{ value: 'AT', label: 'Austria' },
	{ value: 'IE', label: 'Ireland' },
	{ value: 'PL', label: 'Poland' },
	{ value: 'CZ', label: 'Czech Republic' },
	{ value: 'HU', label: 'Hungary' },
	{ value: 'RO', label: 'Romania' },
	{ value: 'GR', label: 'Greece' },
	{ value: 'TR', label: 'Turkey' },
	{ value: 'IL', label: 'Israel' },
	{ value: 'ZA', label: 'South Africa' },
	{ value: 'EG', label: 'Egypt' },
	{ value: 'MA', label: 'Morocco' },
	{ value: 'AE', label: 'United Arab Emirates' },
	{ value: 'SG', label: 'Singapore' },
	{ value: 'MY', label: 'Malaysia' },
	{ value: 'TH', label: 'Thailand' },
	{ value: 'ID', label: 'Indonesia' },
	{ value: 'PH', label: 'Philippines' },
];

const CustomSwitch: React.FC<{
	checked: boolean;
	onChange: (checked: boolean) => void;
	className?: string;
	onText?: string;
	offText?: string;
}> = ({ checked, onChange, className = '', onText, offText }) => (
	<div className="flex items-center">
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
			{checked && (
				<span className="absolute left-1.5 w-px h-1.5 bg-white rounded-sm z-10"></span>
			)}
			{!checked && (
				<span className="absolute right-1 top-1.1 w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-transparent z-10"></span>
			)}
			<span
				className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 z-20 ${
					checked ? 'translate-x-4' : ''
				} ${checked ? '' : 'border-2 border-gray-300'}`}
			></span>
		</button>
		<span
			className={`text-sm ml-2 ${
				checked ? 'text-brand-light' : 'text-gray-700'
			}`}
		>
			{checked ? onText : offText}
		</span>
	</div>
);

const UpdateReleasePage: React.FC<UpdateReleasePageProps> = ({
	release,
	onSave,
	formData,
	setFormData,
	onEditTrack,
	genres,
}) => {
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

	const fileInputRef = useRef<HTMLInputElement>(null);
	const [artistData, setArtistData] = useState<ArtistData[]>([]);
	const [trackData, setTrackData] = useState<TrackData[]>([]);
	const [trackDetails, setTrackDetails] = useState<{ [key: string]: any }>({});
	const [playingTrack, setPlayingTrack] = useState<string | null>(null);

	const [progress, setProgress] = useState<number>(0);
	const [labels, setLabels] = useState<LabelOption[]>([]);
	const [labelsData, setLabelsData] = useState<any[]>([]);
	const [subgenres, setSubgenres] = useState<SubgenreOption[]>([]);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [publishers, setPublishers] = useState<PublisherOption[]>([]);
	const [publishersData, setPublishersData] = useState<any[]>([]);
	const [isCreateArtistModalOpen, setIsCreateArtistModalOpen] = useState(false);
	const [newArtistData, setNewArtistData] = useState({
		name: '',
		email: '',
		amazon_music_id: '',
		apple_music_id: '',
		deezer_id: '',
		spotify_id: '',
	});
	const [isEditingTrack, setIsEditingTrack] = useState(false);
	const [selectedTrack, setSelectedTrack] = useState<ReleaseTrack | null>(null);
	const [trackFormData, setTrackFormData] = useState<Track | null>(null);
	const [isTracksExpanded, setIsTracksExpanded] = useState(false);
	const [copiedTrackId, setCopiedTrackId] = useState<string | null>(null);

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
					setLabelsData(labelsData.data);
					setLabels(
						labelsData.data.map((label: any) => ({
							value: label.external_id,
							label: label.name,
						}))
					);
				}

				// Si hay un género seleccionado, cargar sus subgéneros
				if (formData?.genre) {
					const selectedGenre = genres.find(
						(g: GenreData) => g.id === formData.genre
					);
					if (selectedGenre) {
						setSubgenres(
							selectedGenre.subgenres.map(
								(sub: { id: number; name: string }) => ({
									value: sub.id,
									label: sub.name,
								})
							)
						);
					} else {
						setSubgenres([]);
					}
				}

				// Fetch publishers
				const publishersRes = await fetch('/api/admin/getAllPublishers');
				const publishersData = await publishersRes.json();
				if (publishersData.success && Array.isArray(publishersData.data)) {
					setPublishersData(publishersData.data);
					setPublishers(
						publishersData.data.map((publisher: any) => ({
							value: publisher.external_id,
							label: publisher.name,
						}))
					);
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};

		fetchData();
	}, [formData?.genre, genres]);

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

	const handleDeleteArtist = (index: number) => {
		setFormData(prev => ({
			...prev,
			artists: prev.artists?.filter((_, i) => i !== index) || [],
		}));
	};

	const handleDeleteTrack = (index: number) => {
		setFormData(prev => ({
			...prev,
			tracks: prev.tracks?.filter((_, i) => i !== index) || [],
		}));
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

	const handleEditTrack = async (track: ReleaseTrack) => {
		console.log('Editando track:', track);
		try {
			// Si es un track nuevo (no tiene external_id o es undefined), lo manejamos directamente
			if (!track.external_id || track.external_id === 'undefined') {
				console.log('Editando track nuevo');
				setSelectedTrack(track);
				onEditTrack(track);
				return;
			}

			// Solo hacemos la llamada a la API si tenemos un external_id válido
			if (track.external_id && track.external_id !== 'undefined') {
				console.log('Editando track existente con ID:', track.external_id);
				const response = await fetch(
					`/api/admin/getTrackById/${track.external_id}`
				);
				if (!response.ok) {
					throw new Error('Error al obtener el track');
				}
				const data = await response.json();
				if (data.success) {
					setSelectedTrack(data.data);
					onEditTrack(data.data);
				} else {
					throw new Error(data.error || 'Error al obtener el track');
				}
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al cargar los datos del track');
		}
	};

	const handleTrackSave = async (updatedTrack: Partial<Track>) => {
		console.log('handleTrackSave called with updatedTrack:', updatedTrack);
		try {
			if (!selectedTrack) {
				console.log('No selectedTrack found, returning');
				return;
			}

			// Convertir el Track actualizado a ReleaseTrack
			const releaseTrack: ReleaseTrack = {
				external_id: selectedTrack.external_id,
				order: updatedTrack.order || selectedTrack.order,
				title: updatedTrack.name || selectedTrack.title,
				artists: updatedTrack.artists || selectedTrack.artists,
				ISRC: updatedTrack.ISRC || selectedTrack.ISRC,
				generate_isrc:
					updatedTrack.generate_isrc ?? selectedTrack.generate_isrc,
				DA_ISRC: updatedTrack.DA_ISRC || selectedTrack.DA_ISRC,
				genre: updatedTrack.genre || selectedTrack.genre,
				genre_name: updatedTrack.genre_name || selectedTrack.genre_name,
				subgenre: updatedTrack.subgenre || selectedTrack.subgenre,
				subgenre_name:
					updatedTrack.subgenre_name || selectedTrack.subgenre_name,
				mix_name: updatedTrack.mix_name || selectedTrack.mix_name,
				resource:
					typeof updatedTrack.resource === 'string'
						? updatedTrack.resource
						: selectedTrack.resource,
				dolby_atmos_resource:
					updatedTrack.dolby_atmos_resource ||
					selectedTrack.dolby_atmos_resource,
				album_only: updatedTrack.album_only ?? selectedTrack.album_only,
				explicit_content:
					updatedTrack.explicit_content ?? selectedTrack.explicit_content,
				track_length: updatedTrack.track_lenght || selectedTrack.track_length,
			};
			console.log('Converted to releaseTrack:', releaseTrack);

			// Actualizar el estado local primero
			setFormData(prev => {
				console.log('Previous formData:', prev);
				// Si el track tiene external_id, actualizarlo en el array tracks
				if (selectedTrack.external_id) {
					const updatedTracks =
						prev.tracks?.map(track =>
							track.external_id === selectedTrack.external_id
								? releaseTrack
								: track
						) || [];
					console.log('Updated tracks array:', updatedTracks);
					return {
						...prev,
						tracks: updatedTracks,
					};
				}
				// Si es un track nuevo, actualizarlo en newTracks
				else {
					const updatedNewTracks =
						prev.newTracks?.map(track => {
							if (track.order === selectedTrack.order) {
								return {
									title: releaseTrack.title,
									mixName: releaseTrack.mix_name,
									order: releaseTrack.order,
									resource: releaseTrack.resource,
									dolby_atmos_resource: releaseTrack.dolby_atmos_resource,
									ISRC: releaseTrack.ISRC,
									DA_ISRC: releaseTrack.DA_ISRC,
									genre: releaseTrack.genre,
									genre_name: releaseTrack.genre_name || '',
									subgenre: releaseTrack.subgenre,
									subgenre_name: releaseTrack.subgenre_name || '',
									album_only: releaseTrack.album_only,
									explicit_content: releaseTrack.explicit_content,
									track_length: releaseTrack.track_length,
									generate_isrc: releaseTrack.generate_isrc,
									artists: releaseTrack.artists,
								};
							}
							return track;
						}) || [];
					console.log('Updated newTracks array:', updatedNewTracks);
					return {
						...prev,
						newTracks: updatedNewTracks,
					};
				}
			});

			// Luego actualizar en el servidor
			await onSave({
				...release,
				tracks: formData.tracks || [],
				newTracks: formData.newTracks || [],
			});

			setIsEditingTrack(false);
			setSelectedTrack(null);
			setTrackFormData(null);
		} catch (error) {
			console.error('Error updating track:', error);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<audio ref={audioRef} />
			<div className="bg-white rounded-lg p-6">
				{/* Sección de imagen y datos básicos */}
				<div className="space-y-2 bg-slate-50 p-2">
					<div className="flex items-center gap-4 relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
						{/* Elementos decorativos musicales */}
						<div className="absolute inset-0">
							{/* Ondas de sonido decorativas */}
							<div className="absolute top-0 left-0 w-full h-full">
								<div className="absolute top-1/4 left-0 w-full h-1 bg-brand-light/30 animate-pulse"></div>
								<div className="absolute top-1/3 left-0 w-full h-1 bg-brand-light/20 animate-pulse delay-75"></div>
								<div className="absolute top-1/2 left-0 w-full h-1 bg-brand-light/10 animate-pulse delay-150"></div>
							</div>

							{/* Notas musicales decorativas */}
							<div className="absolute top-4 right-4 text-brand-light/30 text-4xl">
								♪
							</div>
							<div className="absolute bottom-4 left-4 text-brand-light/30 text-4xl">
								♫
							</div>
							<div className="absolute top-1/2 right-1/4 text-brand-light/30 text-4xl">
								♩
							</div>

							{/* Gradiente suave */}
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_70%)]"></div>
						</div>

						<div className="w-52 h-52 rounded-xl border-2 border-gray-100 flex items-center justify-center overflow-hidden relative group shadow-lg bg-white">
							{imagePreview ? (
								<img
									src={imagePreview}
									alt="Preview"
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="text-center p-4">
									<div className="p-3 bg-gray-50 rounded-lg inline-block">
										<ImageIcon className="h-10 w-10 text-gray-400" />
									</div>
									<span className="mt-2 block text-sm text-gray-500">
										Sin imagen
									</span>
								</div>
							)}
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end justify-center p-4">
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
									className="inline-flex items-center px-4 py-2.5 border border-white/20 shadow-lg text-sm font-medium rounded-lg text-white bg-black/30 backdrop-blur-sm hover:bg-black/40 hover:border-white/30 transition-all duration-200"
								>
									<Upload className="h-4 w-4 mr-2" />
									Cambiar imagen
								</button>
							</div>
						</div>

						<div className="flex-1 flex flex-col gap-4 relative z-10">
							<div>
								<h1 className="text-4xl font-bold text-gray-900 mb-2">
									{formData.name || 'Sin nombre'}
								</h1>
								<div className="flex items-center gap-3">
									<span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 capitalize">
										{formData.kind || 'Sin tipo'}
									</span>
									{formData.genre_name && (
										<span className="px-3 py-1 bg-brand-light/10 rounded-full text-sm text-brand-dark">
											{formData.genre_name}
										</span>
									)}
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
									<div className="text-xs font-medium text-gray-500 mb-1">
										Número de Catálogo
									</div>
									<div className="text-sm font-semibold text-gray-900">
										{formData.catalogue_number || 'Sin número'}
									</div>
								</div>
								<div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
									<div className="text-xs font-medium text-gray-500 mb-1">
										Género
									</div>
									<div className="text-sm font-semibold text-gray-900">
										{formData.genre_name || 'Sin género'}
									</div>
								</div>
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

				{/* Sección de tracks */}
				<div className="space-y-2">
					<button
						onClick={() => setIsTracksExpanded(!isTracksExpanded)}
						className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-all duration-200 shadow-sm"
					>
						<div className="flex items-center gap-3">
							<div className="p-2 bg-brand-dark/10 rounded-lg">
								<Music size={20} className="text-brand-dark" />
							</div>
							<div className="flex flex-col items-start">
								<span className="text-lg font-semibold text-gray-900">
									Tracks
								</span>
								<span className="text-sm text-gray-500">
									{release.tracks?.length || 0} canciones
								</span>
							</div>
						</div>
						<div
							className={`transform transition-transform duration-200 ${
								isTracksExpanded ? 'rotate-180' : ''
							}`}
						>
							<ChevronDown className="h-5 w-5 text-gray-400" />
						</div>
					</button>

					<div
						className={`space-y-3 transition-all duration-200 ${
							isTracksExpanded ? 'block' : 'hidden'
						}`}
					>
						{release.tracks?.map((track, index) => {
							const genre = genres.find(g => g.id === track.genre);
							const subgenre = genre?.subgenres.find(
								s => s.id === track.subgenre
							);

							return (
								<div
									key={index}
									className="flex items-center gap-4 group hover:bg-gray-50/50 transition-all duration-200 rounded-xl p-4 border border-gray-100 shadow-sm"
								>
									<div className="flex flex-col items-center gap-2">
										<button
											onClick={() => handlePlayPause(index, track.resource)}
											className="p-2.5 text-brand-dark hover:text-brand-light transition-all duration-200 bg-white rounded-full shadow-sm hover:shadow-md hover:scale-105"
										>
											{playingTrack === index.toString() ? (
												<Pause size={18} />
											) : (
												<Play size={18} />
											)}
										</button>
									</div>
									<div className="flex-1">
										<div className="flex items-center gap-3">
											<div className="text-base font-medium text-gray-900">
												{track.title || 'Track sin nombre'}
											</div>
											{track.mix_name && (
												<span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
													{track.mix_name}
												</span>
											)}
										</div>
										{playingTrack === index.toString() && (
											<div className="mt-2 w-full bg-gray-100 rounded-full h-1">
												<div
													className="bg-brand-dark h-1 rounded-full transition-all duration-300"
													style={{ width: `${progress}%` }}
												></div>
											</div>
										)}
										<div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
											{track.ISRC && (
												<div className="flex items-center gap-1">
													<span className="text-xs font-medium text-gray-400">
														ISRC:
													</span>
													{track.ISRC}
												</div>
											)}
											{track.resource && (
												<div className="flex items-center gap-2">
													<button
														onClick={() => {
															navigator.clipboard.writeText(track.resource);
															setCopiedTrackId(
																track.external_id || `new-${index}`
															);
															toast.success('Enlace copiado al portapapeles');
															setTimeout(() => setCopiedTrackId(null), 2000);
														}}
														className={`inline-flex items-center gap-1 px-2 py-1 text-xs ${
															copiedTrackId ===
															(track.external_id || `new-${index}`)
																? 'bg-green-500 hover:bg-green-600 text-white'
																: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
														} rounded-full transition-all duration-200`}
													>
														{copiedTrackId ===
														(track.external_id || `new-${index}`) ? (
															<>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	className="h-3.5 w-3.5"
																	viewBox="0 0 20 20"
																	fill="currentColor"
																>
																	<path
																		fillRule="evenodd"
																		d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																		clipRule="evenodd"
																	/>
																</svg>
																Copiado
															</>
														) : (
															<>
																<Link size={14} />
																Copiar enlace
															</>
														)}
													</button>
												</div>
											)}
											{track.dolby_atmos_resource && (
												<div className="flex items-center gap-1">
													<span className="text-xs font-medium text-gray-400">
														Dolby:
													</span>
													{track.dolby_atmos_resource}
												</div>
											)}
											{track.track_length && (
												<div className="flex items-center gap-1">
													<span className="text-xs font-medium text-gray-400">
														Duración:
													</span>
													{track.track_length}
												</div>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<button
											onClick={() =>
												handleEditTrack({
													...track,
													title: track.title,
													mix_name: track.mix_name,
													resource: track.resource,
													dolby_atmos_resource: track.dolby_atmos_resource,
													ISRC: track.ISRC,
													DA_ISRC: track.DA_ISRC,
													genre: track.genre,
													genre_name: track.genre_name || '',
													subgenre: track.subgenre,
													subgenre_name: track.subgenre_name || '',
													album_only: track.album_only,
													explicit_content: track.explicit_content,
													track_length: track.track_length,
													generate_isrc: track.generate_isrc,
													artists: track.artists,
													order: track.order,
												})
											}
											className="p-2 text-gray-400 hover:text-brand-dark opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 rounded-lg"
										>
											<Pencil size={18} />
										</button>
										<button
											onClick={() => handleDeleteTrack(index)}
											className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 rounded-lg"
										>
											<Trash2 size={18} />
										</button>
									</div>
								</div>
							);
						})}

						{(!release.tracks || release.tracks.length === 0) && (
							<div className="text-sm text-gray-500 p-6 bg-gray-50 rounded-xl border border-gray-100 text-center">
								No hay tracks agregados
							</div>
						)}

						{/* Mostrar tracks pendientes de subir */}
						{formData.newTracks && formData.newTracks.length > 0 && (
							<div className="mt-6">
								<h4 className="text-sm font-medium text-gray-700 mb-3 px-1">
									Tracks pendientes de subir
								</h4>
								{formData.newTracks.map((track, index) => {
									const releaseTrack: ReleaseTrack = {
										title: track.title,
										mix_name: track.mixName,
										resource: track.resource,
										dolby_atmos_resource: track.dolby_atmos_resource,
										ISRC: track.ISRC,
										DA_ISRC: track.DA_ISRC,
										genre: track.genre,
										genre_name: track.genre_name,
										subgenre: track.subgenre,
										subgenre_name: track.subgenre_name,
										album_only: track.album_only,
										explicit_content: track.explicit_content,
										track_length: track.track_length,
										generate_isrc: track.generate_isrc,
										artists: track.artists,
										order: track.order,
									};

									return (
										<div
											key={`pending-${index}`}
											className="flex items-center gap-4 group hover:bg-gray-50/50 transition-all duration-200 rounded-xl p-4 border-2 border-brand-light/20 bg-brand-light/5"
										>
											<div className="flex flex-col items-center gap-2">
												<button
													onClick={() => handleEditTrack(releaseTrack)}
													className="p-2 text-gray-400 hover:text-brand-dark opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 rounded-lg"
												>
													<Pencil size={18} />
												</button>
											</div>
											<div className="flex-1">
												<div className="flex items-center gap-3">
													<div className="text-base font-medium text-gray-900">
														{track.title || 'Track sin nombre'}
													</div>
													{track.mixName && (
														<span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
															{track.mixName}
														</span>
													)}
												</div>
												<div className="mt-2 flex items-center gap-2">
													<span className="text-xs px-2 py-0.5 bg-brand-light/20 text-brand-dark rounded-full">
														Pendiente de subir
													</span>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													onClick={() => {
														setFormData(prev => ({
															...prev,
															newTracks:
																prev.newTracks?.filter((_, i) => i !== index) ||
																[],
														}));
													}}
													className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 rounded-lg"
												>
													<Trash2 size={18} />
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}

						{(uploadProgress || isProcessing) && (
							<div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
								{uploadProgress && !isProcessing && (
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-brand-dark h-2 rounded-full transition-all duration-300"
											style={{ width: `${uploadProgress.percentage}%` }}
										></div>
									</div>
								)}
								<p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
									{isProcessing ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-dark border-t-transparent" />
											<span>Procesando track...</span>
										</>
									) : (
										`Subiendo... ${uploadProgress?.percentage}%`
									)}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Información Básica del Release */}
				<div className="mt-8 space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
						Información Básica
					</h3>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Nombre
							</label>
							<input
								type="text"
								name="name"
								value={formData?.name}
								onChange={handleChange}
								className={inputStyles}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Label
							</label>
							<Select
								value={
									labels.find(label => label.value === formData?.label) || {
										value: formData?.label || 0,
										label: formData?.label_name || 'Seleccionar label',
									}
								}
								onChange={(selectedOption: SingleValue<LabelOption>) => {
									if (selectedOption) {
										const selectedLabel = labelsData.find(
											(l: any) => l.external_id === selectedOption.value
										);
										if (selectedLabel) {
											setFormData(prev => ({
												...prev,
												label: selectedLabel.external_id,
												label_name: selectedLabel.name,
											}));
										}
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
									value: formData?.language || '',
									label: formData?.language === 'ES' ? 'Español' : 'English',
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
								value={RELEASE_TYPES.find(
									type => type.value === formData?.kind
								)}
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
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Número de Catálogo
							</label>
							<input
								type="text"
								name="catalogue_number"
								value={formData.catalogue_number}
								onChange={handleChange}
								className={inputStyles}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Versión del Release
							</label>
							<input
								type="text"
								name="release_version"
								value={formData.release_version}
								onChange={handleChange}
								className={inputStyles}
							/>
						</div>
					</div>
				</div>

				{/* Clasificación y Fechas */}
				<div className="mt-8 space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
						Clasificación y Fechas
					</h3>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Género
							</label>
							<Select<SubgenreOption>
								value={
									formData.genre_name
										? {
												value:
													genres.find(
														(g: GenreData) => g.name === formData.genre_name
													)?.id || 0,
												label: formData.genre_name,
										  }
										: null
								}
								onChange={(selectedOption: SingleValue<SubgenreOption>) => {
									if (selectedOption) {
										const selectedGenre = genres.find(
											(g: GenreData) => g.id === selectedOption.value
										);
										if (selectedGenre) {
											setFormData(prev => ({
												...prev,
												genre: selectedGenre.id,
												genre_name: selectedGenre.name,
												subgenre: 0,
												subgenre_name: '',
											}));
											setSubgenres(
												selectedGenre.subgenres.map(
													(sub: { id: number; name: string }) => ({
														value: sub.id,
														label: sub.name,
													})
												)
											);
										}
									}
								}}
								options={genres.map((genre: GenreData) => ({
									value: genre.id,
									label: genre.name,
								}))}
								placeholder="Seleccionar género"
								className="react-select-container"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Subgénero
							</label>
							<Select<SubgenreOption>
								value={
									subgenres.find(sub => sub.value === formData.subgenre) || {
										value: formData.subgenre || 0,
										label: formData.subgenre_name || 'Seleccionar subgénero',
									}
								}
								onChange={(selectedOption: SingleValue<SubgenreOption>) => {
									if (selectedOption) {
										setFormData(prev => ({
											...prev,
											subgenre: selectedOption.value,
											subgenre_name: selectedOption.label,
										}));
									}
								}}
								options={subgenres}
								placeholder="Seleccionar subgénero"
								className="react-select-container"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
								isDisabled={!formData.genre || subgenres.length === 0}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								¿Es Nuevo Lanzamiento?
							</label>
							<Select
								value={{
									value: formData.is_new_release || 0,
									label: formData.is_new_release ? 'Sí' : 'No',
								}}
								onChange={(
									selectedOption: SingleValue<{ value: number; label: string }>
								) => {
									if (selectedOption) {
										setFormData(prev => ({
											...prev,
											is_new_release: selectedOption.value,
										}));
									}
								}}
								options={[
									{ value: 1, label: 'Sí' },
									{ value: 0, label: 'No' },
								]}
								className="react-select-container"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Fecha Oficial
							</label>
							<input
								type="date"
								name="official_date"
								value={formData.official_date}
								onChange={handleChange}
								className={inputStyles}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Fecha Original
							</label>
							<input
								type="date"
								name="original_date"
								value={formData.original_date}
								onChange={handleChange}
								className={inputStyles}
							/>
						</div>
					</div>
				</div>

				{/* Derechos y Copyright */}
				<div className="mt-8 space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
						Derechos y Copyright
					</h3>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Publisher
							</label>
							<Select<PublisherOption>
								value={
									publishers.find(
										publisher => publisher.value === formData.publisher
									) || {
										value: formData.publisher || 0,
										label: formData.publisher_name || 'Seleccionar publisher',
									}
								}
								onChange={(selectedOption: SingleValue<PublisherOption>) => {
									if (selectedOption) {
										const selectedPublisher = publishersData.find(
											(p: any) => p.external_id === selectedOption.value
										);
										if (selectedPublisher) {
											setFormData(prev => ({
												...prev,
												publisher: selectedPublisher.external_id,
												publisher_name: selectedPublisher.name,
											}));
										}
									}
								}}
								options={publishers}
								placeholder="Seleccionar publisher"
								className="react-select-container"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Año del Publisher
							</label>
							<Select
								value={{
									value: formData.publisher_year || '',
									label: formData.publisher_year || 'Seleccionar año',
								}}
								onChange={(
									selectedOption: SingleValue<{ value: string; label: string }>
								) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'publisher_year',
												value: selectedOption.value,
											},
										} as React.ChangeEvent<HTMLInputElement>);
									}
								}}
								options={Array.from({ length: 100 }, (_, i) => {
									const year = new Date().getFullYear() - i;
									return {
										value: year.toString(),
										label: year.toString(),
									};
								})}
								className="react-select-container"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-gray-500 ml-1 inline-block"
								>
									<circle cx="12" cy="12" r="10" />
									<path d="M14.5 9a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 1 0 7 0" />
								</svg>
								Titular de Copyright
							</label>
							<input
								type="text"
								name="copyright_holder"
								value={formData.copyright_holder}
								onChange={handleChange}
								className={inputStyles}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-gray-500 ml-1 inline-block"
								>
									<circle cx="12" cy="12" r="10" />
									<path d="M14.5 9a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 1 0 7 0" />
								</svg>
								Año del Copyright
							</label>
							<Select
								value={{
									value: formData.copyright_holder_year || '',
									label: formData.copyright_holder_year || 'Seleccionar año',
								}}
								onChange={(
									selectedOption: SingleValue<{ value: string; label: string }>
								) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'copyright_holder_year',
												value: selectedOption.value,
											},
										} as React.ChangeEvent<HTMLInputElement>);
									}
								}}
								options={Array.from({ length: 100 }, (_, i) => {
									const year = new Date().getFullYear() - i;
									return {
										value: year.toString(),
										label: year.toString(),
									};
								})}
								className="react-select-container"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex items-end min-h-9">
							<CustomSwitch
								checked={formData?.generate_ean ?? false}
								onChange={checked => {
									const event = {
										target: {
											name: 'generate_ean',
											checked: checked,
											type: 'checkbox',
										},
									} as React.ChangeEvent<HTMLInputElement>;
									handleChange(event);
								}}
								onText=""
								offText=""
							/>
							<label className="ml-2 mr-4 block text-sm text-gray-700">
								Generar UPC
							</label>
							{!formData.generate_ean && (
								<div className="mt-2">
									<input
										type="text"
										name="ean"
										value={formData.ean || ''}
										onChange={handleChange}
										className="w-full px-3 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
										placeholder="Ingrese el UPC"
									/>
								</div>
							)}
						</div>
						<div className="flex items-end">
							<CustomSwitch
								checked={formData.dolby_atmos ?? false}
								onChange={checked => {
									const event = {
										target: {
											name: 'dolby_atmos',
											checked: checked,
											type: 'checkbox',
										},
									} as React.ChangeEvent<HTMLInputElement>;
									handleChange(event);
								}}
								onText=""
								offText=""
							/>
							<label className="ml-2 block text-sm text-gray-700">
								Dolby Atmos
							</label>
						</div>
					</div>
				</div>

				{/* Distribución */}
				<div className="mt-8 space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
						Distribución
					</h3>
					<div className="mt-2 p-4">
						<label className="block text-sm font-medium text-gray-700">
							Territorio
						</label>
						<Select
							value={{
								value: formData.territory || '',
								label: formData.territory || 'Seleccionar territorio',
							}}
							onChange={(
								selectedOption: SingleValue<{ value: string; label: string }>
							) => {
								if (selectedOption) {
									handleChange({
										target: {
											name: 'territory',
											value: selectedOption.value,
										},
									} as React.ChangeEvent<HTMLInputElement>);
								}
							}}
							options={[
								{ value: 'worldwide', label: 'Worldwide' },
								{ value: 'select', label: 'select' },
								{ value: 'deselect', label: 'deselect' },
							]}
							className="react-select-container"
							classNamePrefix="react-select"
							styles={reactSelectStyles}
						/>
						{formData.territory !== 'worldwide' && (
							<div className="mt-2 flex gap-x-4">
								<Select<CountryOption, true>
									isMulti
									value={[]}
									onChange={selectedOptions => {
										if (selectedOptions) {
											const newCountries = selectedOptions.map(
												option => option.value
											);
											setFormData(prev => ({
												...prev,
												countries: [
													...(prev.countries || []),
													...newCountries,
												].slice(0, 200),
											}));
										}
									}}
									options={RELEVANT_COUNTRIES.filter(
										country => !formData.countries?.includes(country.value)
									)}
									placeholder="Seleccionar países"
									className="react-select-container"
									classNamePrefix="react-select"
									styles={reactSelectStyles}
									noOptionsMessage={() => 'No hay más países disponibles'}
									isClearable
									closeMenuOnSelect={false}
								/>
								{formData.countries && formData.countries.length > 0 && (
									<div className="mt-2 bg-gray-50">
										<div className="text-sm text-gray-500">
											Países seleccionados: {formData.countries.length}/200
										</div>
										<div className="flex flex-wrap gap-2 mt-2">
											{formData.countries.map((countryCode, index) => (
												<div
													key={index}
													className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
												>
													<span>
														{RELEVANT_COUNTRIES.find(
															c => c.value === countryCode
														)?.label || countryCode}
													</span>
													<button
														type="button"
														onClick={() => {
															setFormData(prev => ({
																...prev,
																countries:
																	prev.countries?.filter(
																		(_, i) => i !== index
																	) || [],
															}));
														}}
														className="text-gray-500 hover:text-red-500"
													>
														<XCircle size={14} />
													</button>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Artistas y YouTube Declaration */}
				<div className="mt-8 space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
						Artistas y YouTube
					</h3>
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
								noOptionsMessage={({ inputValue }) => (
									<div className="p-2 text-center">
										<p className="text-sm text-gray-500 mb-2">
											No se encontraron artistas para "{inputValue}"
										</p>
										<button
											onClick={() => {
												setNewArtistData(prev => ({
													...prev,
													name: inputValue,
												}));
												setIsCreateArtistModalOpen(true);
											}}
											className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-500 bg-neutral-100 hover:text-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
										>
											<Plus className="w-4 h-4 mr-1" />
											Crear nuevo artista
										</button>
									</div>
								)}
								className="react-select-container w-72 self-end"
								classNamePrefix="react-select"
								styles={reactSelectStyles}
							/>

							<div className="space-y-2 min-h-52 p-2">
								<div className="flex flex-wrap gap-2 items-center">
									{(formData.artists || []).map((artist, index) => (
										<div
											key={`existing-${index}`}
											className="flex items-start justify-between p-3 bg-gray-50 w-60 rounded-lg"
										>
											<div className="flex gap-3">
												<div className="p-2 bg-white rounded-full">
													<User className="w-14 h-14 text-gray-600" />
												</div>
												<div className="flex flex-col items-center">
													<span className="font-medium">{artist.name}</span>
													<div className="flex items-center gap-2 mt-1">
														<CustomSwitch
															checked={artist.kind === 'main'}
															onChange={checked => {
																setFormData(prev => ({
																	...prev,
																	artists: (prev.artists || []).map(
																		(a: Artist, i: number) =>
																			i === index
																				? {
																						...a,
																						kind: checked
																							? 'main'
																							: 'featuring',
																				  }
																				: a
																	),
																}));
															}}
															className="mx-auto"
															onText="Principal"
															offText="Invitado"
														/>
													</div>
													<div className="flex items-center gap-2 mt-1">
														<input
															type="number"
															min={-2147483648}
															max={2147483647}
															value={artist.order}
															onChange={e => {
																const value = parseInt(e.target.value, 10);
																setFormData(prev => ({
																	...prev,
																	artists: (prev.artists || []).map(
																		(a: Artist, i: number) =>
																			i === index
																				? {
																						...a,
																						order: isNaN(value) ? 0 : value,
																				  }
																				: a
																	),
																}));
															}}
															className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:border-brand-light"
														/>
														<label className="text-xs text-gray-500">
															Orden
														</label>
													</div>
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

									{(formData.newArtists || []).map(
										(artist: NewArtist, index: number) => (
											<div
												key={`new-${index}`}
												className="flex items-start justify-between p-3 bg-gray-50 w-60 rounded-lg border-2 border-brand-light"
											>
												<div className="flex gap-3">
													<div className="p-2 bg-white rounded-full">
														<User className="w-14 h-14 text-gray-600" />
													</div>
													<div className="flex flex-col items-center">
														<span className="font-medium">{artist.name}</span>
														<div className="flex items-center gap-2 mt-1">
															<CustomSwitch
																checked={artist.kind === 'main'}
																onChange={checked => {
																	setFormData(prev => ({
																		...prev,
																		newArtists: (prev.newArtists || []).map(
																			(a: NewArtist, i: number) =>
																				i === index
																					? {
																							...a,
																							kind: checked
																								? 'main'
																								: 'featuring',
																					  }
																					: a
																		),
																	}));
																}}
																className="mx-auto"
																onText="Principal"
																offText="Invitado"
															/>
														</div>
														<div className="flex items-center gap-2 mt-1">
															<input
																type="number"
																min={-2147483648}
																max={2147483647}
																value={artist.order}
																onChange={e => {
																	const value = parseInt(e.target.value, 10);
																	setFormData(prev => ({
																		...prev,
																		newArtists: (prev.newArtists || []).map(
																			(a: NewArtist, i: number) =>
																				i === index
																					? {
																							...a,
																							order: isNaN(value) ? 0 : value,
																					  }
																					: a
																		),
																	}));
																}}
																className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:border-brand-light"
															/>
															<label className="text-xs text-gray-500">
																Orden
															</label>
														</div>
													</div>
												</div>
												<button
													onClick={() => {
														setFormData(prev => ({
															...prev,
															newArtists:
																prev.newArtists?.filter(
																	(_: NewArtist, i: number) => i !== index
																) || [],
														}));
													}}
													className="p-2 text-gray-400 hover:text-red-600 transition-colors"
												>
													<Trash2 size={20} />
												</button>
											</div>
										)
									)}
								</div>
							</div>
						</div>
					</div>
					<div className="flex items-center">
						<CustomSwitch
							checked={formData?.youtube_declaration ?? false}
							onChange={checked => {
								const event = {
									target: {
										name: 'youtube_declaration',
										checked: checked,
										type: 'checkbox',
									},
								} as React.ChangeEvent<HTMLInputElement>;
								handleChange(event);
							}}
							onText=""
							offText=""
						/>
						<label className="ml-2 block text-sm text-gray-700">
							YouTube Declaration
						</label>
					</div>
				</div>
			</div>
			{isUploadModalOpen && (
				<UploadTrackToRelease
					isOpen={isUploadModalOpen}
					releaseId={release._id}
					onClose={() => setIsUploadModalOpen(false)}
					onTrackUploaded={track => {
						// Agregar el nuevo track al array newTracks
						const newTrack = {
							title: track.name || '',
							mixName: track.mix_name || '',
							order:
								(formData.newTracks?.length || 0) +
								(formData.tracks?.length || 0),
							resource:
								track.resource instanceof File
									? URL.createObjectURL(track.resource)
									: '',
							file: track.resource instanceof File ? track.resource : null,
							dolby_atmos_resource: track.dolby_atmos_resource || '',
							ISRC: track.ISRC || '',
							DA_ISRC: track.DA_ISRC || '',
							genre: track.genre || 0,
							genre_name: track.genre_name || '',
							subgenre: track.subgenre || 0,
							subgenre_name: track.subgenre_name || '',
							album_only: track.album_only || false,
							explicit_content: track.explicit_content || false,
							track_length: track.track_length || '',
							generate_isrc: track.generate_isrc || false,
							artists: track.artists || [],
						};

						setFormData(prev => ({
							...prev,
							newTracks: [...(prev.newTracks || []), newTrack],
						}));

						setIsUploadModalOpen(false);
					}}
				/>
			)}
			{isCreateArtistModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-medium text-gray-900">
								Crear Nuevo Artista
							</h3>
							<button
								onClick={() => setIsCreateArtistModalOpen(false)}
								className="text-gray-400 hover:text-gray-500"
							>
								<XCircle className="h-6 w-6" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Nombre
								</label>
								<input
									type="text"
									value={newArtistData.name}
									onChange={e =>
										setNewArtistData(prev => ({
											...prev,
											name: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">
									Email
								</label>
								<input
									type="email"
									value={newArtistData.email}
									onChange={e =>
										setNewArtistData(prev => ({
											...prev,
											email: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className=" text-sm font-medium text-gray-700 flex items-center gap-2">
										<div className="h-6 w-6 flex items-center">
											<Image
												src="/icons/Amazon_Music_logo.svg"
												alt="Amazon Music"
												width={24}
												height={24}
												className="object-contain"
											/>
										</div>
										ID Amazon Music
									</label>
									<input
										type="text"
										value={newArtistData.amazon_music_id}
										onChange={e =>
											setNewArtistData(prev => ({
												...prev,
												amazon_music_id: e.target.value,
											}))
										}
										className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className=" text-sm font-medium text-gray-700 flex items-center gap-2">
										<div className="h-6 w-6 flex items-center">
											<Image
												src="/icons/ITunes_logo.svg"
												alt="Apple Music"
												width={24}
												height={24}
												className="object-contain"
											/>
										</div>
										ID Apple Music
									</label>
									<input
										type="text"
										value={newArtistData.apple_music_id}
										onChange={e =>
											setNewArtistData(prev => ({
												...prev,
												apple_music_id: e.target.value,
											}))
										}
										className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className=" text-sm font-medium text-gray-700 flex items-center gap-2">
										<div className="h-6 w-6 flex items-center justify-center">
											<Image
												src="/icons/dezzer_logo.svg"
												alt="Deezer"
												width={20}
												height={20}
												className="object-contain"
											/>
										</div>
										ID Deezer
									</label>
									<input
										type="text"
										value={newArtistData.deezer_id}
										onChange={e =>
											setNewArtistData(prev => ({
												...prev,
												deezer_id: e.target.value,
											}))
										}
										className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className=" text-sm font-medium text-gray-700 flex items-center gap-2">
										<div className="h-6 w-6 flex items-center justify-center">
											<Image
												src="/icons/spotify_logo.svg"
												alt="Spotify"
												width={20}
												height={20}
												className="object-contain"
											/>
										</div>
										ID Spotify
									</label>
									<input
										type="text"
										value={newArtistData.spotify_id}
										onChange={e =>
											setNewArtistData(prev => ({
												...prev,
												spotify_id: e.target.value,
											}))
										}
										className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-3">
							<button
								onClick={() => setIsCreateArtistModalOpen(false)}
								className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
							>
								Cancelar
							</button>
							<button
								onClick={() => {
									// Crear el nuevo artista con la estructura requerida
									const newArtist: NewArtist = {
										order: (formData.newArtists || []).length,
										artist: 0,
										kind: 'main',
										name: newArtistData.name,
										email: newArtistData.email,
										amazon_music_identifier: newArtistData.amazon_music_id,
										apple_identifier: newArtistData.apple_music_id,
										deezer_identifier: newArtistData.deezer_id,
										spotify_identifier: newArtistData.spotify_id,
									};

									// Actualizar el formData con el nuevo artista en el array newArtists
									setFormData(prev => ({
										...prev,
										newArtists: [...(prev.newArtists || []), newArtist],
									}));

									// Limpiar el formulario y cerrar el modal
									setNewArtistData({
										name: '',
										email: '',
										amazon_music_id: '',
										apple_music_id: '',
										deezer_id: '',
										spotify_id: '',
									});
									setIsCreateArtistModalOpen(false);
								}}
								className="px-4 py-2 text-sm font-medium text-white bg-brand-light hover:bg-brand-dark rounded-md"
							>
								Crear Artista
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default UpdateReleasePage;
