import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, XCircle, Plus, Trash2, Upload } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-clock/dist/Clock.css';
import Cleave from 'cleave.js/react';
import 'cleave.js/dist/addons/cleave-phone.us';
import { Track } from '@/types/track';

export interface GenreData {
	id: number;
	name: string;
	subgenres: Array<{
		id: number;
		name: string;
	}>;
}

interface Artist {
	external_id: number;
	name: string;
	role: string;
}

interface Contributor {
	contributor: number;
	name: string;
	role: string;
	role_name: string;
}

interface Publisher {
	external_id: number;
	name: string;
	role: string;
}

interface Role {
	id: number;
	name: string;
}

interface Release {
	_id?: string;
	name: string;
	picture?: {
		base64: string;
	};
}

interface Genre {
	id: number;
	name: string;
	subgenres?: Subgenre[];
}

interface Subgenre {
	id: number;
	name: string;
}

export interface TrackFormProps {
	track?: Track;
	onTrackChange?: (track: Partial<Track>) => void;
	onSave: (track: Partial<Track>) => Promise<void>;
	genres: GenreData[];
	onClose: () => void;
}

const TrackForm: React.FC<TrackFormProps> = ({
	track,
	onTrackChange,
	onSave,
	genres,
	onClose,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [contributors, setContributors] = useState<Contributor[]>([]);
	const [publishers, setPublishers] = useState<Publisher[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const trackLengthRef = React.useRef<HTMLInputElement>(null);
	const sampleStartRef = React.useRef<HTMLInputElement>(null);
	const [releases, setReleases] = useState<Release[]>([]);
	const [subgenres, setSubgenres] = useState<Subgenre[]>([]);

	const [formData, setFormData] = useState<Track>({
		_id: '',
		external_id: track?.external_id || '',
		name: track?.name || '',
		mix_name: track?.mix_name || '',
		DA_ISRC: track?.DA_ISRC || '',
		ISRC: track?.ISRC || '',
		__v: 0,
		album_only: track?.album_only || false,
		artists: track?.artists || [],
		contributors: [],
		copyright_holder: track?.copyright_holder || '',
		copyright_holder_year: track?.copyright_holder_year || '',
		createdAt: '',
		dolby_atmos_resource: track?.dolby_atmos_resource || '',
		explicit_content: track?.explicit_content || false,
		generate_isrc: track?.generate_isrc || false,
		genre: track?.genre || 0,
		genre_name: track?.genre_name || '',
		subgenre: track?.subgenre || 0,
		subgenre_name: track?.subgenre_name || '',
		label_share: 0,
		language: track?.language || '',
		order: track?.order || 0,
		publishers: [],
		release: '',
		resource: track?.resource || '',
		sample_start: '',
		track_lenght: track?.track_lenght || '',
		updatedAt: '',
		vocals: '',
		status: track?.status || 'Borrador',
	});

	// Efecto para inicializar los subgéneros cuando se carga el componente
	useEffect(() => {
		if (track?.genre) {
			const selectedGenre = genres.find(g => g.id === track.genre);
			if (selectedGenre) {
				setSubgenres(selectedGenre.subgenres || []);
			}
		}
	}, [track, genres]);

	// Efecto para actualizar subgéneros cuando cambia el género
	useEffect(() => {
		if (formData.genre) {
			const selectedGenre = genres.find(g => g.id === formData.genre);
			if (selectedGenre) {
				setSubgenres(selectedGenre.subgenres || []);

				// Si hay un subgénero seleccionado pero no está en la lista actual, lo agregamos
				if (
					formData.subgenre &&
					!selectedGenre.subgenres.some(s => s.id === formData.subgenre)
				) {
					const currentSubgenre = {
						id: formData.subgenre,
						name: formData.subgenre_name || '',
					};
					setSubgenres(prev => [...prev, currentSubgenre]);
				}
			} else {
				setSubgenres([]);
			}
		} else {
			setSubgenres([]);
		}
	}, [formData.genre, genres, formData.subgenre, formData.subgenre_name]);

	useEffect(() => {
		console.log('formData trck: ', formData);
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Fetch releases
				const releasesRes = await fetch('/api/admin/getAllReleases');
				const releasesData = await releasesRes.json();
				if (releasesData.success) {
					setReleases(releasesData.data);
				}
				const contributorRes = await fetch('/api/admin/getAllContributor');
				const contributorData = await contributorRes.json();
				if (contributorData.success) {
					setContributors(contributorData.data);
				}
				const publisherRes = await fetch('/api/admin/getAllContributor');
				const publisherData = await publisherRes.json();
				if (publisherData.success) {
					setPublishers(publisherData.data);
				}

				// Fetch artists
				const artistsRes = await fetch('/api/admin/getAllArtists');
				const artistsData = await artistsRes.json();
				if (artistsData.success) {
					// Filter artists to only include those with role 'artista'
					const filteredArtists = artistsData.data.filter(
						(user: any) => user.role === 'artista'
					);
					setArtists(filteredArtists);
				}

				// Fetch roles
				const rolesRes = await fetch('/api/admin/getContributorRoles');
				const rolesData = await rolesRes.json();
				if (rolesData.success) {
					setRoles(rolesData.data);
				}
			} catch (err) {
				console.error('Error fetching data:', err);
				setError('Error al cargar los datos. Por favor, inténtalo de nuevo.');
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	// Efecto para actualizar formData cuando cambia el track
	useEffect(() => {
		if (track) {
			console.log('Incoming track:', track);
			const updatedFormData = {
				_id: track._id || '',
				external_id: track.external_id || '',
				name: track.title || track.name || '', // Use title if available, fallback to name
				mix_name: track.mix_name || '',
				DA_ISRC: track.DA_ISRC || '',
				ISRC: track.ISRC || '',
				__v: track.__v || 0,
				album_only: track.album_only || false,
				artists: track.artists || [],
				contributors: track.contributors || [],
				copyright_holder: track.copyright_holder || '',
				copyright_holder_year: track.copyright_holder_year || '',
				createdAt: track.createdAt || '',
				dolby_atmos_resource: track.dolby_atmos_resource || '',
				explicit_content: track.explicit_content || false,
				generate_isrc: track.generate_isrc || false,
				genre: typeof track.genre === 'number' ? track.genre : 0,
				genre_name: track.genre_name || '',
				subgenre: typeof track.subgenre === 'number' ? track.subgenre : 0,
				subgenre_name: track.subgenre_name || '',
				label_share: track.label_share || 0,
				language: track.language || '',
				order: track.order || 0,
				publishers: track.publishers || [],
				release: track.release || '',
				resource: track.resource || '',
				sample_start: track.sample_start || '',
				track_lenght: track.track_length || '',
				updatedAt: track.updatedAt || '',
				vocals: track.vocals || '',
				status: track.status || 'Borrador',
			};

			console.log('Updated form data:', updatedFormData);
			setFormData(updatedFormData);
		}
	}, [track]);

	const handleAddArtist = () => {
		setFormData(prev => ({
			...prev,
			artists: [
				...(prev.artists || []),
				{ artist: 0, kind: '', order: (prev.artists || []).length, name: '' },
			],
		}));
	};

	const handleAddContributor = () => {
		setFormData(prev => ({
			...prev,
			contributors: [
				...(prev.contributors || []),
				{
					contributor: 0,
					name: '',
					role: 0,
					order: (prev.contributors || []).length,
					role_name: '',
				},
			],
		}));
	};

	const handleAddPublisher = () => {
		setFormData(prev => ({
			...prev,
			publishers: [
				...(prev.publishers || []),
				{ publisher: 0, author: '', order: (prev.publishers || []).length },
			],
		}));
	};

	const handleRemoveArtist = (index: number) => {
		setFormData(prev => ({
			...prev,
			artists: (prev.artists || []).filter((_, i) => i !== index),
		}));
	};

	const handleRemoveContributor = (index: number) => {
		setFormData(prev => ({
			...prev,
			contributors: (prev.contributors || []).filter((_, i) => i !== index),
		}));
	};

	const handleRemovePublisher = (index: number) => {
		setFormData(prev => ({
			...prev,
			publishers: (prev.publishers || []).filter((_, i) => i !== index),
		}));
	};

	const handleArtistChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newArtists = [...(prev.artists || [])];
			if (!newArtists[index]) {
				newArtists[index] = { artist: 0, kind: '', order: 0, name: '' };
			}

			if (field === 'artist' && typeof value === 'string') {
				const selectedArtist = artists.find(
					a => String(a.external_id) === value
				);
				if (selectedArtist) {
					newArtists[index] = {
						...newArtists[index],
						artist: parseInt(value),
						name: selectedArtist.name,
					};
				}
			} else if (field === 'kind' || field === 'order') {
				newArtists[index] = { ...newArtists[index], [field]: value };
			}

			return { ...prev, artists: newArtists };
		});
	};

	const handleContributorChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newContributors = [...(prev.contributors || [])];
			if (!newContributors[index]) {
				newContributors[index] = {
					contributor: 0,
					name: '',
					role: 0,
					order: 0,
					role_name: '',
				};
			}

			if (field === 'name') {
				const selectedContributor = contributors.find(c => c.name === value);
				if (selectedContributor) {
					newContributors[index] = {
						...newContributors[index],
						contributor: selectedContributor.contributor,
						name: selectedContributor.name,
					};
				}
			} else if (field === 'role') {
				const selectedRole = roles.find(r => r.id === Number(value));
				if (selectedRole) {
					newContributors[index] = {
						...newContributors[index],
						role: Number(value),
						role_name: selectedRole.name,
					};
				}
			} else if (field === 'order') {
				newContributors[index] = {
					...newContributors[index],
					order: typeof value === 'string' ? parseInt(value) : value,
				};
			}

			return { ...prev, contributors: newContributors };
		});
	};

	const handlePublisherChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newPublishers = [...(prev.publishers || [])];
			if (!newPublishers[index]) {
				newPublishers[index] = { publisher: 0, author: '', order: 0 };
			}

			if (field === 'publisher') {
				const numValue =
					typeof value === 'string' ? parseInt(value) : Number(value);
				if (!isNaN(numValue)) {
					const selectedPublisher = publishers.find(
						p => p.external_id === numValue
					);
					if (selectedPublisher) {
						newPublishers[index] = {
							...newPublishers[index],
							publisher: selectedPublisher.external_id,
							author: selectedPublisher.name || '',
						};
					}
				}
			} else if (field === 'author') {
				newPublishers[index] = {
					...newPublishers[index],
					author: (value as string) || '',
				};
			} else if (field === 'order') {
				const numValue =
					typeof value === 'string' ? parseInt(value) : Number(value);
				if (!isNaN(numValue)) {
					newPublishers[index] = {
						...newPublishers[index],
						order: numValue,
					};
				}
			}

			return { ...prev, publishers: newPublishers };
		});
	};

	const handleTimeChange = (name: string, value: string) => {
		setFormData(prev => {
			const updatedData = { ...prev, [name]: value };
			if (onTrackChange) {
				onTrackChange(updatedData);
			}
			return updatedData;
		});
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value, type } = e.target;
		let newValue: any = value;

		if (name === 'genre') {
			const selectedGenre = genres.find(g => g.id === Number(value));
			newValue = {
				genre: Number(value),
				genre_name: selectedGenre?.name || '',
				subgenre: 0,
				subgenre_name: '',
			};
		} else if (name === 'subgenre') {
			const selectedSubgenre = subgenres.find(s => s.id === Number(value));
			newValue = {
				subgenre: Number(value),
				subgenre_name: selectedSubgenre?.name || '',
			};
		} else if (type === 'checkbox') {
			newValue = (e.target as HTMLInputElement).checked;
		}

		// Actualizar el estado local
		setFormData(prev => {
			const updatedData =
				typeof newValue === 'object'
					? { ...prev, ...newValue }
					: { ...prev, [name]: newValue };

			// Notificar al componente padre del cambio
			if (onTrackChange) {
				onTrackChange(updatedData);
			}

			return updatedData;
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setIsLoading(true);
		setError(null);

		try {
			await onSave(formData as Track);
		} catch (err: any) {
			setError(err.message || 'Error al crear el track');
		} finally {
			setIsLoading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type === 'audio/wav' || file.name.endsWith('.wav')) {
				setSelectedFile(file);
				setFormData(prev => {
					const updatedData = { ...prev, resource: file };
					if (onTrackChange) {
						onTrackChange(updatedData);
					}
					return updatedData;
				});
				setUploadProgress(0);
			} else {
				alert('Por favor, selecciona un archivo WAV válido');
				e.target.value = '';
			}
		}
	};

	return (
		<div className="bg-white rounded-lg p-6">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-lg font-medium text-gray-900">
					{track ? 'Editar Track' : 'Nuevo Track'}
				</h3>
			</div>

			{error && (
				<div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				{/* seleccionar lanzamiento */}
				<div className="flex gap-x-4">
					{/* File Upload Section */}
					<div className="w-1/3 space-y-4">
						<div className="flex items-center gap-4">
							<label className="block text-sm font-medium text-gray-700">
								Archivo WAV
							</label>
							<div>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileChange}
									accept=".wav"
									className="hidden"
								/>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
								>
									<Upload className="h-4 w-4 mr-2" />
									Subir archivo
								</button>
							</div>
						</div>
						{uploadProgress > 0 && uploadProgress < 100 && (
							<div className="w-full bg-gray-200 rounded-full h-1.5">
								<div
									className="bg-brand-light h-1.5 rounded-full transition-all duration-300"
									style={{ width: `${uploadProgress}%` }}
								></div>
							</div>
						)}
						{formData.resource && (
							<div className="text-sm text-gray-500 mt-1">
								Archivo actual:{' '}
								{typeof formData.resource === 'string'
									? formData.resource
									: formData.resource.name}
							</div>
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-6">
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
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Nombre de mix
						</label>
						<input
							type="text"
							name="mix_name"
							value={formData.mix_name}
							onChange={handleChange}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							ISRC
						</label>
						<input
							type="text"
							name="ISRC"
							value={formData.ISRC}
							onChange={handleChange}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							DA ISRC
						</label>
						<input
							type="text"
							name="DA_ISRC"
							value={formData.DA_ISRC}
							onChange={handleChange}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Género
						</label>
						<select
							name="genre"
							value={formData.genre || ''}
							onChange={handleChange}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
						>
							<option key="genre-empty" value="">
								Seleccionar género
							</option>
							{genres.map(genre => (
								<option key={`genre-${genre.id}`} value={genre.id}>
									{genre.name}
								</option>
							))}
						</select>
						{formData.genre && (
							<p className="text-xs text-gray-500 mt-1">
								Género actual:{' '}
								{genres.find(g => g.id === formData.genre)?.name || ''}
							</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Subgénero
						</label>
						<select
							name="subgenre"
							value={formData.subgenre || ''}
							onChange={handleChange}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
						>
							<option key="subgenre-empty" value="">
								Seleccionar subgénero
							</option>
							{subgenres.map(subgenre => (
								<option key={`subgenre-${subgenre.id}`} value={subgenre.id}>
									{subgenre.name}
								</option>
							))}
						</select>
						{formData.subgenre && (
							<p className="text-xs text-gray-500 mt-1">
								Subgénero actual:{' '}
								{subgenres.find(s => s.id === formData.subgenre)?.name || ''}
							</p>
						)}
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
							<option key="language-ES" value="ES">
								Español
							</option>
							<option key="language-EN" value="EN">
								English
							</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Label Share
						</label>
						<Cleave
							options={{
								numericOnly: true,
								prefix: '',
								blocks: [3],
								delimiter: '',
							}}
							name="label_share"
							value={formData.label_share || ''}
							onChange={e =>
								setFormData(prev => ({
									...prev,
									label_share: e.target.value
										? parseFloat(e.target.value)
										: undefined,
								}))
							}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Vocals
						</label>
						<select
							name="vocals"
							value={formData.vocals}
							onChange={handleChange}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
						>
							<option value="">Seleccionar idioma</option>
							<option value="EN">English</option>
							<option value="ES">Español</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Copyright Holder
						</label>
						<input
							type="text"
							name="copyright_holder"
							value={formData.copyright_holder}
							onChange={handleChange}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Copyright Year
						</label>
						<input
							type="text"
							name="copyright_holder_year"
							value={formData.copyright_holder_year}
							onChange={handleChange}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Dolby Atmos Resource
						</label>
						<input
							type="text"
							name="dolby_atmos_resource"
							value={formData.dolby_atmos_resource}
							onChange={handleChange}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Duración
						</label>
						<Cleave
							options={{
								time: true,
								timePattern: ['h', 'm', 's'],
								timeFormat: 'HH:mm:ss',
								blocks: [2, 2, 2],
								delimiter: ':',
							}}
							name="track_lenght"
							value={formData.track_lenght || ''}
							onChange={e => handleTimeChange('track_lenght', e.target.value)}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							placeholder="00:00:00"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Sample Start
						</label>
						<Cleave
							options={{
								time: true,
								timePattern: ['h', 'm', 's'],
								timeFormat: 'HH:mm:ss',
								blocks: [2, 2, 2],
								delimiter: ':',
							}}
							name="sample_start"
							value={formData.sample_start}
							onChange={e => handleTimeChange('sample_start', e.target.value)}
							className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							placeholder="00:00:00"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Orden
						</label>
						<input
							type="number"
							name="order"
							value={formData.order || ''}
							onChange={e =>
								setFormData(prev => ({
									...prev,
									order: parseInt(e.target.value),
								}))
							}
							onKeyPress={e => {
								if (!/[0-9]/.test(e.key)) {
									e.preventDefault();
								}
							}}
							className="w-20 p-2 border rounded"
							placeholder="200"
							min="0"
						/>
					</div>
				</div>

				{/* Checkboxes Section */}
				<div className="grid grid-cols-3 gap-4">
					<div className="flex items-center">
						<input
							type="checkbox"
							name="album_only"
							checked={formData.album_only}
							onChange={handleChange}
							className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
						/>
						<label className="ml-2 block text-sm text-gray-700">
							Solo Album
						</label>
					</div>

					<div className="flex items-center">
						<input
							type="checkbox"
							name="explicit_content"
							checked={formData.explicit_content}
							onChange={handleChange}
							className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
						/>
						<label className="ml-2 block text-sm text-gray-700">
							Contenido Explícito
						</label>
					</div>

					<div className="flex items-center">
						<input
							type="checkbox"
							name="generate_isrc"
							checked={formData.generate_isrc}
							onChange={handleChange}
							className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
						/>
						<label className="ml-2 block text-sm text-gray-700">
							Generar ISRC
						</label>
					</div>
				</div>

				{/* Artists Section */}
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium text-gray-900">Artistas</h3>
						<button
							type="button"
							onClick={handleAddArtist}
							className="p-2 text-brand-light hover:text-brand-dark rounded-full"
						>
							<Plus size={20} />
						</button>
					</div>
					<div className="space-y-4">
						{formData.artists?.length === 0 ? (
							<div className="flex items-center gap-2">
								<select
									value={formData.artists?.[0]?.artist ?? ''}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
										const value = e.target.value;
										if (value) {
											handleArtistChange(0, 'artist', value);
										}
									}}
									className="flex-1 p-2 border rounded"
								>
									<option value="">Select Artist</option>
									{artists?.map(a => (
										<option
											key={`artist-${a?.external_id || ''}`}
											value={a?.external_id || ''}
										>
											{a?.name || ''}
										</option>
									))}
								</select>

								<select
									value={formData.artists?.[0]?.kind ?? ''}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
										handleArtistChange(0, 'kind', e.target.value);
									}}
									className="flex-1 p-2 border rounded"
								>
									<option value="">Select Kind</option>
									<option value="main">Main</option>
									<option value="featuring">Featuring</option>
									<option value="remixer">Remixer</option>
								</select>

								<input
									type="number"
									value={
										typeof formData.artists?.[0]?.order === 'number'
											? formData.artists[0].order
											: 0
									}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const val = parseInt(e.target.value);
										handleArtistChange(0, 'order', isNaN(val) ? 0 : val);
									}}
									className="w-20 p-2 border rounded"
									placeholder="Order"
								/>
							</div>
						) : (
							formData.artists?.map((artist, index) => (
								<div key={index} className="flex items-center gap-2">
									<select
										value={artist.artist ?? ''}
										onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
											const value = e.target.value;
											if (value) {
												handleArtistChange(index, 'artist', value);
											}
										}}
										className="flex-1 p-2 border rounded"
									>
										<option value="">Select Artist</option>
										{artists?.map(a => (
											<option
												key={`artist-${a?.external_id || ''}`}
												value={a?.external_id || ''}
											>
												{a?.name || ''}
											</option>
										))}
									</select>

									<select
										value={artist.kind ?? ''}
										onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
											handleArtistChange(index, 'kind', e.target.value);
										}}
										className="flex-1 p-2 border rounded"
									>
										<option value="">Select Kind</option>
										<option value="main">Main</option>
										<option value="featuring">Featuring</option>
										<option value="remixer">Remixer</option>
									</select>

									<input
										type="number"
										value={typeof artist.order === 'number' ? artist.order : 0}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											const val = parseInt(e.target.value);
											handleArtistChange(index, 'order', isNaN(val) ? 0 : val);
										}}
										className="w-20 p-2 border rounded"
										placeholder="Order"
									/>

									{formData.artists && formData.artists.length > 1 && (
										<button
											onClick={() => handleRemoveArtist(index)}
											className="p-2 text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									)}
								</div>
							))
						)}
					</div>
				</div>

				{/* Contributors Section */}
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium text-gray-900">Contributors</h3>
						<button
							type="button"
							onClick={handleAddContributor}
							className="p-2 text-brand-light hover:text-brand-dark rounded-full"
						>
							<Plus size={20} />
						</button>
					</div>
					<div className="space-y-4">
						{formData.contributors?.length === 0 ? (
							<div className="flex items-center gap-2">
								<select
									value={formData.contributors?.[0]?.name || ''}
									onChange={e => {
										const selectValue = e.target.value;
										if (selectValue && selectValue !== '') {
											handleContributorChange(0, 'name', selectValue);
										}
									}}
									className="flex-1 p-2 border rounded"
								>
									<option value="">Select Contributor</option>
									{contributors?.map((c, idx) => (
										<option
											key={`contributor-0-${idx}-${c?.name || 'empty'}`}
											value={c?.name || ''}
										>
											{c?.name || ''}
										</option>
									))}
								</select>

								<select
									value={formData.contributors?.[0]?.role || ''}
									onChange={e => {
										const value = e.target.value;
										if (value && value !== '') {
											handleContributorChange(0, 'role', value);
										}
									}}
									className="flex-1 p-2 border rounded"
								>
									<option value="">Select Role</option>
									{roles?.map((r, idx) => (
										<option
											key={`role-0-${idx}-${r?.id || 'empty'}`}
											value={r?.id ? String(r.id) : ''}
										>
											{r?.name || ''}
										</option>
									))}
								</select>

								<input
									type="number"
									value={formData.contributors?.[0]?.order ?? 0}
									onChange={e => {
										const val = parseInt(e.target.value);
										if (!isNaN(val)) {
											handleContributorChange(0, 'order', val);
										}
									}}
									className="w-20 p-2 border rounded"
									placeholder="Order"
								/>
							</div>
						) : (
							formData.contributors?.map((contributor, index) => (
								<div
									key={`contributor-row-${index}`}
									className="flex items-center gap-2"
								>
									<select
										value={contributor.name || ''}
										onChange={e => {
											const selectValue = e.target.value;
											if (selectValue && selectValue !== '') {
												handleContributorChange(index, 'name', selectValue);
											}
										}}
										className="flex-1 p-2 border rounded"
									>
										<option value="">Select Contributor</option>
										{contributors?.map((c, idx) => (
											<option
												key={`contributor-${index}-${idx}-${
													c?.name || 'empty'
												}`}
												value={c?.name || ''}
											>
												{c?.name || ''}
											</option>
										))}
									</select>

									<select
										value={contributor.role || ''}
										onChange={e => {
											const value = e.target.value;
											if (value && value !== '') {
												handleContributorChange(index, 'role', value);
											}
										}}
										className="flex-1 p-2 border rounded"
									>
										<option value="">Select Role</option>
										{roles?.map((r, idx) => (
											<option
												key={`role-${index}-${idx}-${r?.id || 'empty'}`}
												value={r?.id ? String(r.id) : ''}
											>
												{r?.name || ''}
											</option>
										))}
									</select>

									<input
										type="number"
										value={contributor.order ?? 0}
										onChange={e => {
											const val = parseInt(e.target.value);
											if (!isNaN(val)) {
												handleContributorChange(index, 'order', val);
											}
										}}
										className="w-20 p-2 border rounded"
										placeholder="Order"
									/>

									{formData.contributors &&
										formData.contributors.length > 1 && (
											<button
												onClick={() => handleRemoveContributor(index)}
												className="p-2 text-red-600 hover:text-red-800"
											>
												<Trash2 size={20} />
											</button>
										)}
								</div>
							))
						)}
					</div>
				</div>

				{/* Publishers Section */}
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium text-gray-900">Publishers</h3>
						<button
							type="button"
							onClick={handleAddPublisher}
							className="p-2 text-brand-light hover:text-brand-dark rounded-full"
						>
							<Plus size={20} />
						</button>
					</div>
					<div className="space-y-4">
						{formData.publishers?.length === 0 ? (
							<div className="flex items-center gap-2">
								<select
									value={String(formData.publishers?.[0]?.publisher || '')}
									onChange={e =>
										handlePublisherChange(
											0,
											'publisher',
											e.target.value ? parseInt(e.target.value) : 0
										)
									}
									className="flex-1 p-2 border rounded"
								>
									<option value="">Seleccionar Publisher</option>
									{publishers?.map((p, idx) => (
										<option
											key={`publisher-${p?.external_id || idx}`}
											value={String(p?.external_id || '')}
										>
											{p?.name || ''}
										</option>
									))}
								</select>

								<input
									type="text"
									name="author"
									value={formData.publishers?.[0]?.author || ''}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										handlePublisherChange(0, 'author', e.target.value);
									}}
									className="flex-1 p-2 border rounded"
									placeholder="Autor"
								/>

								<input
									type="number"
									value={formData.publishers?.[0]?.order ?? 0}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const val = parseInt(e.target.value);
										handlePublisherChange(0, 'order', isNaN(val) ? 0 : val);
									}}
									className="w-20 p-2 border rounded"
									placeholder="Orden"
								/>
							</div>
						) : (
							formData.publishers?.map((publisher, index) => (
								<div
									key={`publisher-row-${index}`}
									className="flex items-center gap-2"
								>
									<select
										value={String(publisher?.publisher || '')}
										onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
											const value = e.target.value;
											handlePublisherChange(
												index,
												'publisher',
												value ? parseInt(value) : 0
											);
										}}
										className="flex-1 p-2 border rounded"
									>
										<option value="">Seleccionar Publisher</option>
										{publishers?.map((p, idx) => (
											<option
												key={`publisher-${p?.external_id || idx}`}
												value={String(p?.external_id || '')}
											>
												{p?.name || ''}
											</option>
										))}
									</select>

									<input
										type="text"
										name="author"
										value={publisher?.author || ''}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											handlePublisherChange(index, 'author', e.target.value);
										}}
										className="flex-1 p-2 border rounded"
										placeholder="Autor"
									/>

									<input
										type="number"
										value={publisher?.order ?? 0}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											const val = parseInt(e.target.value);
											handlePublisherChange(
												index,
												'order',
												isNaN(val) ? 0 : val
											);
										}}
										className="w-20 p-2 border rounded"
										placeholder="Orden"
									/>

									{formData.publishers && formData.publishers.length > 1 && (
										<button
											onClick={() => handleRemovePublisher(index)}
											className="p-2 text-red-600 hover:text-red-800"
										>
											<Trash2 size={20} />
										</button>
									)}
								</div>
							))
						)}
					</div>
				</div>

				<div className="flex justify-end gap-3 mt-6">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={isLoading}
						className="px-4 py-2 text-sm font-medium text-white bg-brand-light hover:bg-brand-dark rounded-md disabled:opacity-50"
					>
						{isLoading ? (
							<div className="flex items-center gap-2">
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								<span>Guardando...</span>
							</div>
						) : (
							<div className="flex items-center gap-2">
								<Save className="h-4 w-4" />
								<span>{track ? 'Guardar cambios' : 'Crear track'}</span>
							</div>
						)}
					</button>
				</div>
			</form>
		</div>
	);
};

export default TrackForm;
