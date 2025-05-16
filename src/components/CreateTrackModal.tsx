import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, XCircle, Plus, Trash2, Upload } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-clock/dist/Clock.css';
import Cleave from 'cleave.js/react';
import 'cleave.js/dist/addons/cleave-phone.us';
import Select from 'react-select';
import { Track } from '@/types/track';
import { SingleValue } from 'react-select';
import { LANGUAGES, LanguageOption } from '@/constants/languages';
import CustomSwitch from './CustomSwitch';
import TrackArtistSelector, { TrackArtist } from './TrackArtistSelector';
import Image from 'next/image';
import ContributorSelector from './ContributorSelector';

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

interface NewArtistData {
	name: string;
	email: string;
	amazon_music_id: string;
	apple_music_id: string;
	deezer_id: string;
	spotify_id: string;
}

const customSelectStyles = {
	control: (provided: any) => ({
		...provided,
		border: 'none',
		borderBottom: '1px solid #D1D5DB',
		borderRadius: '0',
		boxShadow: 'none',
		'&:hover': {
			borderBottom: '1px solid #4B5563',
		},
	}),
	option: (provided: any, state: any) => ({
		...provided,
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
	menu: (provided: any) => ({
		...provided,
		zIndex: 9999,
	}),
	singleValue: (provided: any) => ({
		...provided,
		color: '#1F2937',
	}),
};

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
	const [isCreateArtistModalOpen, setIsCreateArtistModalOpen] = useState(false);
	const [newArtistData, setNewArtistData] = useState<NewArtistData>({
		name: '',
		email: '',
		amazon_music_id: '',
		apple_music_id: '',
		deezer_id: '',
		spotify_id: '',
	});

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

			<form onSubmit={handleSubmit} className="space-y-8">
				{/* Sección de Archivo y Recursos */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">
						Archivo y Recursos
					</h3>
					<div className="flex gap-x-4">
						<div className="w-1/3">
							<div className="relative group">
								<div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
									<div className="flex flex-col items-center justify-center pt-5 pb-6">
										<Upload className="w-12 h-12 mb-3 text-gray-400 group-hover:text-brand-light transition-colors duration-200" />
										<p className="mb-2 text-sm text-gray-500">
											<span className="font-semibold">Click para subir</span> o
											arrastra y suelta
										</p>
										<p className="text-xs text-gray-500">WAV (MAX. 800MB)</p>
									</div>
									<input
										type="file"
										ref={fileInputRef}
										onChange={handleFileChange}
										accept=".wav"
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
									/>
								</div>
							</div>

							{uploadProgress > 0 && uploadProgress < 100 && (
								<div className="mt-4">
									<div className="flex justify-between text-sm text-gray-600 mb-1">
										<span>Subiendo archivo...</span>
										<span>{uploadProgress}%</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-brand-light h-2 rounded-full transition-all duration-300 ease-in-out"
											style={{ width: `${uploadProgress}%` }}
										></div>
									</div>
								</div>
							)}

							{formData.resource && (
								<div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-gray-100 rounded-lg">
											<Upload className="w-5 h-5 text-gray-600" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">
												{typeof formData.resource === 'string'
													? formData.resource
													: formData.resource.name}
											</p>
											<p className="text-xs text-gray-500">
												{typeof formData.resource === 'string'
													? 'Archivo cargado'
													: 'Listo para subir'}
											</p>
										</div>
										<button
											type="button"
											onClick={() => {
												setSelectedFile(null);
												setFormData(prev => ({ ...prev, resource: '' }));
											}}
											className="p-1 text-gray-400 hover:text-red-500 transition-colors"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Sección de Información Básica */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">
						Información Básica
					</h3>
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
				</div>

				{/* Sección de Metadatos */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Metadatos</h3>
					<div className="grid grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Género
							</label>
							<Select
								name="genre"
								value={
									genres.find(g => g.id === formData.genre)
										? {
												value: formData.genre,
												label:
													genres.find(g => g.id === formData.genre)?.name || '',
										  }
										: null
								}
								onChange={(selectedOption: any) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'genre',
												value: selectedOption.value,
											},
										} as any);
									}
								}}
								options={genres.map(genre => ({
									value: genre.id,
									label: genre.name,
								}))}
								placeholder="Seleccionar género"
								styles={customSelectStyles}
								className="mt-1"
								isClearable
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Subgénero
							</label>
							<Select
								name="subgenre"
								value={
									subgenres.find(s => s.id === formData.subgenre)
										? {
												value: formData.subgenre,
												label:
													subgenres.find(s => s.id === formData.subgenre)
														?.name || '',
										  }
										: null
								}
								onChange={(selectedOption: any) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'subgenre',
												value: selectedOption.value,
											},
										} as any);
									}
								}}
								options={subgenres.map(subgenre => ({
									value: subgenre.id,
									label: subgenre.name,
								}))}
								placeholder="Seleccionar subgénero"
								styles={customSelectStyles}
								className="mt-1"
								isClearable
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Idioma
							</label>
							<Select
								value={
									LANGUAGES.find(lang => lang.value === formData.language) ||
									null
								}
								onChange={(selectedOption: SingleValue<LanguageOption>) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'language',
												value: selectedOption.value,
											},
										} as any);
									}
								}}
								options={LANGUAGES}
								placeholder="Seleccionar idioma"
								styles={customSelectStyles}
								className="mt-1"
								isClearable
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Vocals
							</label>
							<Select
								value={
									LANGUAGES.find(lang => lang.value === formData.vocals) || null
								}
								onChange={(selectedOption: SingleValue<LanguageOption>) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'vocals',
												value: selectedOption.value,
											},
										} as any);
									}
								}}
								options={LANGUAGES}
								placeholder="Seleccionar idioma"
								styles={customSelectStyles}
								className="mt-1"
								isClearable
							/>
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
					</div>
				</div>

				{/* Sección de Configuración */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Configuración</h3>
					<div className="grid grid-cols-3 gap-4">
						<div className="flex items-center">
							<CustomSwitch
								checked={formData.album_only}
								onChange={checked => {
									const event = {
										target: {
											name: 'album_only',
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
								Solo Album
							</label>
						</div>

						<div className="flex items-center">
							<CustomSwitch
								checked={formData.explicit_content}
								onChange={checked => {
									const event = {
										target: {
											name: 'explicit_content',
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
								Contenido Explícito
							</label>
						</div>

						<div className="flex items-center">
							<CustomSwitch
								checked={formData.generate_isrc}
								onChange={checked => {
									const event = {
										target: {
											name: 'generate_isrc',
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
								Generar ISRC
							</label>
						</div>
					</div>
				</div>

				{/* Sección de Artistas */}
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium text-gray-900">Artistas</h3>
						<button
							type="button"
							onClick={() => setIsCreateArtistModalOpen(true)}
							className="p-2 text-brand-light hover:text-brand-dark rounded-full"
						>
							<Plus size={20} />
						</button>
					</div>
					<div className="space-y-4">
						<TrackArtistSelector
							artists={(formData.artists || []).map(artist => ({
								...artist,
								kind: artist.kind as 'main' | 'featuring' | 'remixer',
							}))}
							artistData={
								artists?.map(a => ({
									artist: a?.external_id || 0,
									name: a?.name || '',
								})) || []
							}
							onArtistsChange={newArtists => {
								setFormData(prev => ({
									...prev,
									artists: newArtists.map(artist => ({
										...artist,
										artist: artist.artist,
										kind: artist.kind,
										order: artist.order,
									})),
								}));
							}}
							onDeleteArtist={index => handleRemoveArtist(index)}
							onCreateNewArtist={name => {
								setNewArtistData(prev => ({ ...prev, name }));
								setIsCreateArtistModalOpen(true);
							}}
							reactSelectStyles={customSelectStyles}
						/>
					</div>
				</div>

				{/* Sección de Contributors */}
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium text-gray-900">Contributors</h3>
					</div>
					<div className="space-y-4">
						<ContributorSelector
							contributors={formData.contributors || []}
							contributorData={
								contributors?.map(c => ({
									contributor: c.contributor,
									name: c.name,
								})) || []
							}
							roles={roles || []}
							onContributorsChange={newContributors => {
								setFormData(prev => ({
									...prev,
									contributors: newContributors,
								}));
							}}
							onDeleteContributor={index => handleRemoveContributor(index)}
							reactSelectStyles={customSelectStyles}
						/>
					</div>
				</div>

				{/* Sección de Publishers */}
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
								<div className="flex-1">
									<Select
										value={
											formData.publishers?.[0]?.publisher
												? {
														value: formData.publishers[0].publisher,
														label:
															publishers?.find(
																p =>
																	p.external_id ===
																	formData.publishers?.[0]?.publisher
															)?.name || '',
												  }
												: null
										}
										onChange={(selectedOption: any) => {
											handlePublisherChange(
												0,
												'publisher',
												selectedOption ? selectedOption.value : 0
											);
										}}
										options={
											publishers?.map(p => ({
												value: p.external_id,
												label: p.name,
											})) || []
										}
										placeholder="Seleccionar Publisher"
										styles={customSelectStyles}
										isClearable
									/>
								</div>

								<input
									type="text"
									name="author"
									value={formData.publishers?.[0]?.author || ''}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										handlePublisherChange(0, 'author', e.target.value);
									}}
									className="flex-1 border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
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
									<div className="flex-1">
										<Select
											value={
												publisher?.publisher
													? {
															value: publisher.publisher,
															label:
																publishers?.find(
																	p => p.external_id === publisher.publisher
																)?.name || '',
													  }
													: null
											}
											onChange={(selectedOption: any) => {
												handlePublisherChange(
													index,
													'publisher',
													selectedOption ? selectedOption.value : 0
												);
											}}
											options={
												publishers?.map(p => ({
													value: p.external_id,
													label: p.name,
												})) || []
											}
											placeholder="Seleccionar Publisher"
											styles={customSelectStyles}
											isClearable
										/>
									</div>

									<input
										type="text"
										name="author"
										value={publisher?.author || ''}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											handlePublisherChange(index, 'author', e.target.value);
										}}
										className="flex-1 border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
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
									className="w-full px-3 py-2 border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
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
									className="w-full px-3 py-2 border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
										className="w-full px-3 py-2 border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
										className="w-full px-3 py-2 border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
										className="w-full px-3 py-2 border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
										className="w-full px-3 py-2 border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
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
									const newArtist = {
										order: (formData.artists || []).length,
										artist: 0, // ID temporal que se actualizará cuando se guarde en la base de datos
										name: newArtistData.name,
										kind: 'main',
										email: newArtistData.email,
										amazon_music_identifier: newArtistData.amazon_music_id,
										apple_identifier: newArtistData.apple_music_id,
										deezer_identifier: newArtistData.deezer_id,
										spotify_identifier: newArtistData.spotify_id,
									};

									// Actualizar el formData con el nuevo artista
									setFormData(prev => ({
										...prev,
										artists: [...(prev.artists || []), newArtist],
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

export default TrackForm;
