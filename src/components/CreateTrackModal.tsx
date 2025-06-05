import React, { useState, useEffect } from 'react';
import { X, Save, XCircle, Plus, Trash2, Upload } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-clock/dist/Clock.css';
import Cleave from 'cleave.js/react';
import 'cleave.js/dist/addons/cleave-phone.us';
import Select from 'react-select';
import { Track } from '@/types/track';
import { SingleValue } from 'react-select';
import { LANGUAGES, VOCALS, LanguageOption } from '@/constants/languages';
import CustomSwitch from './CustomSwitch';
import TrackArtistSelector, { TrackArtist } from './TrackArtistSelector';
import Image from 'next/image';
import ContributorSelector from './ContributorSelector';
import { toast, Toaster } from 'react-hot-toast';

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
	external_id: number;
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

interface Subgenre {
	id: number;
	name: string;
}

export interface TrackFormProps {
	track?: Track;
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

const TrackForm: React.FC<TrackFormProps> = ({ track, genres, onClose }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [contributors, setContributors] = useState<Contributor[]>([]);
	const [publishers, setPublishers] = useState<Publisher[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [selectedFileDolby, setSelectedFileDolby] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [subgenres, setSubgenres] = useState<Subgenre[]>([]);
	const [localTrack, setLocalTrack] = useState<Partial<Track>>(track || {});
	const [isCreateArtistModalOpen, setIsCreateArtistModalOpen] = useState(false);
	const [newArtistData, setNewArtistData] = useState<NewArtistData>({
		name: '',
		email: '',
		amazon_music_id: '',
		apple_music_id: '',
		deezer_id: '',
		spotify_id: '',
	});

	// Actualizar el estado local cuando cambia el prop track
	useEffect(() => {
		console.log('track', track);
		setLocalTrack(track || {});
	}, [track]);

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
		if (localTrack?.genre) {
			const selectedGenre = genres.find(g => g.id === localTrack.genre);

			if (selectedGenre) {
				setSubgenres(selectedGenre.subgenres || []);

				if (
					localTrack.subgenre &&
					!selectedGenre.subgenres.some(s => s.id === localTrack.subgenre)
				) {
					const currentSubgenre = {
						id: localTrack.subgenre,
						name: localTrack.subgenre_name || '',
					};
					setSubgenres(prev => [...prev, currentSubgenre]);
				}
			} else {
				setSubgenres([]);
			}
		} else {
			setSubgenres([]);
		}
	}, [
		localTrack?.genre,
		genres,
		localTrack?.subgenre,
		localTrack?.subgenre_name,
	]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const contributorRes = await fetch('/api/admin/getAllContributor');
				const contributorData = await contributorRes.json();
				console.log('CONTRIBUTOR DATA RES', contributorData);
				if (contributorData.success) {
					console.log('CONTRIBUTOR DATA', contributorData);
					setContributors(contributorData.data);
				}
				const publisherRes = await fetch('/api/admin/getAllPublishers');
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
			const updatedFormData = {
				_id: track._id || '',
				external_id: track.external_id || '',
				name: track.title || track.name || '',
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
				track_length: track.track_length || '',
				updatedAt: track.updatedAt || '',
				vocals: track.vocals || '',
				status: track.status || 'Borrador',
			};

			// Solo actualizamos si hay cambios reales
			const hasChanges = Object.keys(updatedFormData).some(
				key =>
					updatedFormData[key as keyof typeof updatedFormData] !==
					track[key as keyof Track]
			);
		}
	}, [track]);

	const handlePublisherChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		const newPublishers = [...(localTrack?.publishers || [])];
		if (!newPublishers[index]) {
			newPublishers[index] = { publisher: 0, author: '', order: 0, name: '' };
		}

		if (field === 'publisher') {
			const numValue =
				typeof value === 'string' ? parseInt(value) : Number(value);
			const selectedPublisher = publishers.find(
				p => p.external_id === numValue
			);
			newPublishers[index] = {
				...newPublishers[index],
				publisher: numValue,
				name: selectedPublisher?.name || '',
			};
		} else if (field === 'author') {
			newPublishers[index] = {
				...newPublishers[index],
				author: value as string,
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

		// Actualizar el estado local directamente
		setLocalTrack(prev => ({
			...prev,
			publishers: newPublishers,
		}));
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
		const updatedTrack =
			typeof newValue === 'object'
				? { ...localTrack, ...newValue }
				: { ...localTrack, [name]: newValue };
		setLocalTrack(updatedTrack);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type === 'audio/wav' || file.name.endsWith('.wav')) {
				setSelectedFile(file);

				setUploadProgress(0);
			} else {
				alert('Por favor, selecciona un archivo WAV válido');
				e.target.value = '';
			}
		}
	};
	const handleFileDolbyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type === 'audio/wav' || file.name.endsWith('.wav')) {
				setSelectedFileDolby(file);

				setUploadProgress(0);
			} else {
				alert('Por favor, selecciona un archivo WAV válido');
				e.target.value = '';
			}
		}
	};

	return (
		<div className="bg-white rounded-lg md:p-6">
			<Toaster
				position="top-right"
				toastOptions={{
					duration: 3000,
				}}
			/>
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

			<form className="space-y-8">
				{/* Sección de Archivo y Recursos */}
				<h3 className="text-lg font-medium text-gray-900">
					Archivo y Recursos
				</h3>
				<div>
					<div className="flex pb-6 ">
						<div className="flex  w-1/2 flex-col justify-center items-center gap-4">
							<p className="text-lg font-medium text-gray-900">
								Archivo de audio
							</p>
							<div className="relative group">
								<div className="flex flex-col items-center justify-center w-full h-40 md:h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
									<div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
										<Upload className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-3 text-gray-400 group-hover:text-brand-light transition-colors duration-200" />
										<p className="mb-1 md:mb-2 text-sm text-gray-500">
											<span className="font-semibold">Click para subir</span> o
											arrastra y suelta
										</p>
										<p className="text-xs text-gray-500">WAV (MAX. 800MB)</p>
									</div>
									<input
										type="file"
										ref={fileInputRef}
										onChange={handleFileDolbyChange}
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

							{track?.resource && (
								<div className="mt-4 p-3 md:p-4 w-1/2 bg-white rounded-lg border border-gray-200 shadow-sm">
									<div className="flex items-center gap-2 md:gap-3">
										<div className="p-1.5 md:p-2 bg-gray-100 rounded-lg">
											<Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">
												{typeof track.resource === 'string'
													? track.resource
													: track.resource.name}
											</p>
											<p className="text-xs text-gray-500">
												{typeof track.resource === 'string'
													? 'Archivo cargado'
													: 'Listo para subir'}
											</p>
										</div>
										<button
											type="button"
											onClick={() => {
												setSelectedFile(null);
											}}
											className="p-1 text-gray-400 hover:text-red-500 transition-colors"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								</div>
							)}
						</div>
						<div className="flex  w-1/2 flex-col justify-center items-center gap-4">
							<img className="w-32" src="/dolby_logo.png" alt="Dolby Atmos" />
							<div className="relative group">
								<div className="flex flex-col items-center justify-center w-full h-40 md:h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
									<div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
										<Upload className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-3 text-gray-400 group-hover:text-brand-light transition-colors duration-200" />
										<p className="mb-1 md:mb-2 text-sm text-gray-500">
											<span className="font-semibold">Click para subir</span> o
											arrastra y suelta
										</p>
										<p className="text-xs text-gray-500">WAV (MAX. 800MB)</p>
									</div>
									<input
										type="file"
										ref={fileInputRef}
										onChange={handleFileDolbyChange}
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

							{track?.dolby_atmos_resource && (
								<div className="mt-4 p-3 md:p-4 w-1/2 bg-white rounded-lg border border-gray-200 shadow-sm">
									<div className="flex items-center gap-2 md:gap-3">
										<div className="p-1.5 md:p-2 bg-gray-100 rounded-lg">
											<Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">
												{typeof track.dolby_atmos_resource === 'string'
													? track.dolby_atmos_resource
													: track.dolby_atmos_resource?.name}
											</p>
											<p className="text-xs text-gray-500">
												{typeof track.dolby_atmos_resource === 'string'
													? 'Archivo cargado'
													: 'Listo para subir'}
											</p>
										</div>
										<button
											type="button"
											onClick={() => {
												setSelectedFileDolby(null);
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
					{(track?.qc_feedback as any) && (
						<div className="bg-red-200 p-4 rounded-lg">
							{/* formData.qc_feedback */}
							<h2 className="text-red-800 font-bold text-center ">
								SECCION DE ERRORES
							</h2>
							<pre className="text-red-500 text-wrap">
								{JSON.stringify(track?.qc_feedback as any, null, 2)}
							</pre>
						</div>
					)}
				</div>
				{/*SECCION DE ERRORES*/}
				{(track?.qc_feedback as any)?.results && (
					<div className="bg-red-200 p-4 rounded-lg">
						{/* formData.qc_feedback */}
						<h2 className="text-red-800 font-bold text-center ">
							SECCION DE ERRORES
						</h2>
						<pre className="text-red-500 text-wrap">
							{JSON.stringify((track?.qc_feedback as any)?.results, null, 2)}
						</pre>
					</div>
				)}
				{/* Sección de Información Básica */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">
						Información Básica
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								Nombre
							</label>
							<input
								type="text"
								name="name"
								value={localTrack.name || ''}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
								required
							/>
						</div>

						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								Nombre de mix
							</label>
							<input
								type="text"
								name="mix_name"
								value={localTrack.mix_name || ''}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								ISRC
							</label>
							<input
								type="text"
								name="ISRC"
								value={localTrack.ISRC || ''}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								DA ISRC
							</label>
							<input
								type="text"
								name="DA_ISRC"
								value={localTrack.DA_ISRC || ''}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								Copyright Holder
							</label>
							<input
								type="text"
								name="copyright_holder"
								value={localTrack.copyright_holder || ''}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								Copyright Year
							</label>
							<input
								type="text"
								name="copyright_holder_year"
								value={localTrack.copyright_holder_year || ''}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								Orden
							</label>
							<input
								onChange={handleChange}
								type="number"
								name="order"
								value={localTrack.order || ''}
								onKeyPress={e => {
									if (!/[0-9]/.test(e.key)) {
										e.preventDefault();
									}
								}}
								className="w-full md:w-20 p-2 border rounded"
								placeholder="200"
								min="0"
							/>
						</div>
					</div>
				</div>

				{/* Sección de Metadatos */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Metadatos</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								Género
							</label>
							<Select
								name="genre"
								value={
									localTrack.genre
										? {
												value: localTrack.genre,
												label: localTrack.genre_name || '',
										  }
										: null
								}
								onChange={(
									selectedOption: SingleValue<{ value: number; label: string }>
								) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'genre',
												value: selectedOption.value.toString(),
											},
										} as React.ChangeEvent<HTMLInputElement>);
									}
								}}
								options={genres.map(genre => ({
									value: genre.id,
									label: genre.name,
								}))}
								className="react-select-container"
								classNamePrefix="react-select"
								styles={customSelectStyles}
							/>
						</div>

						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								Subgénero
							</label>
							<Select
								name="subgenre"
								value={
									localTrack.subgenre
										? {
												value: localTrack.subgenre,
												label: localTrack.subgenre_name || '',
										  }
										: null
								}
								onChange={(
									selectedOption: SingleValue<{ value: number; label: string }>
								) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'subgenre',
												value: selectedOption.value.toString(),
											},
										} as React.ChangeEvent<HTMLInputElement>);
									}
								}}
								options={subgenres.map(subgenre => ({
									value: subgenre.id,
									label: subgenre.name,
								}))}
								className="react-select-container"
								classNamePrefix="react-select"
								styles={customSelectStyles}
								isDisabled={!localTrack.genre}
							/>
						</div>

						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								Idioma
							</label>
							<Select
								name="language"
								value={
									localTrack.language
										? LANGUAGES.find(l => l.value === localTrack.language)
										: null
								}
								onChange={(selectedOption: SingleValue<LanguageOption>) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'language',
												value: selectedOption.value,
											},
										} as React.ChangeEvent<HTMLInputElement>);
									}
								}}
								options={LANGUAGES}
								className="react-select-container"
								classNamePrefix="react-select"
								styles={customSelectStyles}
							/>
						</div>

						<div className="w-full">
							<label className="block text-sm font-medium text-gray-700">
								Vocales
							</label>
							<Select
								name="vocals"
								value={
									localTrack.vocals
										? VOCALS.find(v => v.value === localTrack.vocals)
										: null
								}
								onChange={(selectedOption: SingleValue<LanguageOption>) => {
									if (selectedOption) {
										handleChange({
											target: {
												name: 'vocals',
												value: selectedOption.value,
											},
										} as React.ChangeEvent<HTMLInputElement>);
									}
								}}
								options={VOCALS}
								className="react-select-container"
								classNamePrefix="react-select"
								styles={customSelectStyles}
							/>
						</div>

						<div className="w-full">
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
								value={localTrack?.label_share || ''}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div className="w-full">
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
								name="track_length"
								value={localTrack?.track_length || ''}
								onChange={e => {
									handleChange({
										target: {
											name: 'track_length',
											value: e.target.value,
											type: 'text',
										},
									} as React.ChangeEvent<HTMLInputElement>);
								}}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
								placeholder="00:00:00"
							/>
						</div>

						<div className="w-full">
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
								value={localTrack?.sample_start || ''}
								onChange={e => {
									handleChange({
										target: {
											name: 'sample_start',
											value: e.target.value,
											type: 'text',
										},
									} as React.ChangeEvent<HTMLInputElement>);
								}}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
								placeholder="00:00:00"
							/>
						</div>
					</div>
				</div>

				{/* Sección de Configuración */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Configuración</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
						<div className="flex items-center w-full">
							<CustomSwitch
								checked={localTrack?.album_only || false}
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

						<div className="flex items-center w-full">
							<CustomSwitch
								checked={localTrack?.explicit_content || false}
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

						<div className="flex items-center w-full">
							<CustomSwitch
								checked={localTrack?.generate_isrc || false}
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
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
						<h3 className="text-lg font-medium text-gray-900">Artistas</h3>
						<button
							type="button"
							onClick={() => setIsCreateArtistModalOpen(true)}
							className="p-2.5 text-brand-light hover:text-brand-dark rounded-full hover:bg-gray-50 transition-colors"
						>
							<Plus size={20} />
						</button>
					</div>
					<div className="space-y-4 w-full overflow-hidden">
						<TrackArtistSelector
							artists={(localTrack?.artists || []).map(artist => ({
								...artist,
								kind: artist.kind as 'main' | 'featuring' | 'remixer',
							}))}
							artistData={
								artists?.map(a => ({
									artist: a?.external_id || 0,
									name: a?.name || '',
								})) || []
							}
							onArtistsChange={(newArtists: TrackArtist[]) => {
								// Actualizar el estado local directamente
								const updatedTrack = {
									...localTrack,
									artists: newArtists.map(artist => ({
										...artist,
										artist: artist.artist,
										kind: artist.kind,
										order: artist.order,
									})),
								};
								setLocalTrack(updatedTrack);
							}}
							onDeleteArtist={(index: number) => {
								const newArtists = [...(localTrack?.artists || [])];
								newArtists.splice(index, 1);
								setLocalTrack(prev => ({
									...prev,
									artists: newArtists,
								}));
							}}
							onCreateNewArtist={(name: string) => {
								setNewArtistData(prev => ({ ...prev, name }));
								setIsCreateArtistModalOpen(true);
							}}
							reactSelectStyles={{
								...customSelectStyles,
								control: (provided: any) => ({
									...provided,
									minHeight: '36px',
									'@media (max-width: 768px)': {
										minHeight: '42px',
									},
								}),
								container: (provided: any) => ({
									...provided,
									width: '100%',
								}),
								menu: (provided: any) => ({
									...provided,
									width: '100%',
									zIndex: 9999,
								}),
								valueContainer: (provided: any) => ({
									...provided,
									padding: '0 8px',
									'@media (max-width: 768px)': {
										padding: '0 12px',
									},
								}),
								input: (provided: any) => ({
									...provided,
									margin: '0',
									padding: '0',
								}),
								indicatorsContainer: (provided: any) => ({
									...provided,
									padding: '0 8px',
									'@media (max-width: 768px)': {
										padding: '0 12px',
									},
								}),
								option: (provided: any, state: any) => ({
									...provided,
									padding: '6px 12px',
									'@media (max-width: 768px)': {
										padding: '8px 12px',
									},
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
							}}
						/>
					</div>
				</div>

				{/* Sección de Contributors */}
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
						<h3 className="text-lg font-medium text-gray-900">Contributors</h3>
					</div>
					<div className="space-y-4 w-full overflow-hidden">
						<ContributorSelector
							contributors={localTrack.contributors || []}
							contributorData={
								contributors?.map(c => ({
									external_id: c.external_id,
									name: c.name,
								})) || []
							}
							roles={roles || []}
							onContributorsChange={newContributors => {
								const updatedContributors = newContributors.map(contributor => {
									if (contributor.role && !contributor.role_name) {
										const selectedRole = roles.find(
											r => r.id === contributor.role
										);
										return {
											...contributor,
											role_name: selectedRole?.name || '',
										};
									}
									return contributor;
								});

								const updatedTrack = {
									...localTrack,
									contributors: updatedContributors,
								};

								// Actualizar el estado local
								setLocalTrack(updatedTrack);
							}}
							onDeleteContributor={index => {
								const newContributors = [...(localTrack.contributors || [])];
								newContributors.splice(index, 1);

								const updatedTrack = {
									...localTrack,
									contributors: newContributors,
								};

								// Actualizar el estado local
								setLocalTrack(updatedTrack);
							}}
							reactSelectStyles={{
								...customSelectStyles,
								control: (provided: any) => ({
									...provided,
									minHeight: '36px',
									'@media (max-width: 768px)': {
										minHeight: '42px',
									},
								}),
								container: (provided: any) => ({
									...provided,
									width: '100%',
								}),
								menu: (provided: any) => ({
									...provided,
									width: '100%',
									zIndex: 9999,
								}),
								valueContainer: (provided: any) => ({
									...provided,
									padding: '0 8px',
									'@media (max-width: 768px)': {
										padding: '0 12px',
									},
								}),
								input: (provided: any) => ({
									...provided,
									margin: '0',
									padding: '0',
								}),
								indicatorsContainer: (provided: any) => ({
									...provided,
									padding: '0 8px',
									'@media (max-width: 768px)': {
										padding: '0 12px',
									},
								}),
								option: (provided: any, state: any) => ({
									...provided,
									padding: '6px 12px',
									'@media (max-width: 768px)': {
										padding: '8px 12px',
									},
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
							}}
						/>
					</div>
				</div>

				{/* Sección de Publishers */}
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
						<h3 className="text-lg font-medium text-gray-900">Publishers</h3>
						{/* <button
							type="button"
							onClick={handleAddPublisher}
							className="p-2.5 text-brand-light hover:text-brand-dark rounded-full hover:bg-gray-50 transition-colors"
						>
							<Plus size={20} />
						</button> */}
					</div>
					<div className="space-y-4 w-full overflow-hidden">
						{!localTrack?.publishers?.length ? (
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-2">
								<div className="w-full sm:flex-1">
									<Select
										value={
											localTrack?.publishers?.[0]?.publisher
												? {
														value: localTrack.publishers[0].publisher,
														label:
															publishers?.find(
																p =>
																	p.external_id ===
																	localTrack?.publishers?.[0]?.publisher
															)?.name || '',
												  }
												: null
										}
										onChange={(selectedOption: any) => {
											if (selectedOption) {
												handlePublisherChange(
													0,
													'publisher',
													selectedOption.value
												);
											}
										}}
										options={publishers?.map(p => ({
											value: p.external_id,
											label: p.name,
										}))}
										placeholder="Seleccionar Publisher"
										styles={{
											...customSelectStyles,
											menu: (provided: any) => ({
												...provided,
												zIndex: 9999,
												backgroundColor: 'white',
												boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
											}),
											control: (provided: any) => ({
												...provided,
												minHeight: '36px',
												backgroundColor: 'white',
												border: '1px solid #D1D5DB',
												borderRadius: '4px',
												'&:hover': {
													borderColor: '#4B5563',
												},
											}),
										}}
										isClearable
									/>
								</div>

								<input
									type="text"
									name="author"
									value=""
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										handlePublisherChange(0, 'author', e.target.value);
									}}
									className="w-full sm:flex-1 border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:brand-dark focus:outline-none focus:ring-0"
									placeholder="Autor"
								/>

								<input
									type="number"
									value={0}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const val = parseInt(e.target.value);
										handlePublisherChange(0, 'order', isNaN(val) ? 0 : val);
									}}
									className="w-full sm:w-20 p-2 border rounded"
									placeholder="Orden"
								/>
							</div>
						) : (
							(localTrack?.publishers || []).map((publisher, index) => (
								<div
									key={`publisher-row-${index}`}
									className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-2"
								>
									<div className="w-full sm:flex-1">
										<Select
											value={
												publisher?.publisher
													? {
															value: publisher.publisher,
															label:
																publishers.find(
																	p => p.external_id === publisher.publisher
																)?.name || '',
													  }
													: null
											}
											onChange={selectedOption => {
												if (selectedOption) {
													handlePublisherChange(
														index,
														'publisher',
														selectedOption.value
													);
												} else {
													handlePublisherChange(index, 'publisher', 0);
												}
											}}
											options={publishers.map(p => ({
												value: p.external_id,
												label: p.name,
											}))}
											placeholder="Seleccionar Publisher"
											styles={{
												...customSelectStyles,
												menu: (provided: any) => ({
													...provided,
													zIndex: 99999,
													backgroundColor: 'white',
													boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
												}),
												control: (provided: any) => ({
													...provided,
													minHeight: '36px',
													backgroundColor: 'white',
													border: '1px solid #D1D5DB',
													borderRadius: '4px',
													'&:hover': {
														borderColor: '#4B5563',
													},
												}),
											}}
											isClearable
											menuPortalTarget={document.body}
											menuPosition="fixed"
											className="react-select-container"
											classNamePrefix="react-select"
											instanceId={`publisher-select-${
												publisher?.publisher || 'new'
											}`}
											noOptionsMessage={() => 'No hay publishers disponibles'}
											isSearchable={false}
										/>
									</div>
									<input
										type="text"
										name="author"
										value={publisher?.author || ''}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											handlePublisherChange(index, 'author', e.target.value);
										}}
										className="w-full sm:flex-1 border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:brand-dark focus:outline-none focus:ring-0"
										placeholder="Autor"
									/>
									{(localTrack?.publishers || []).length > 1 && (
										<button className="p-2.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors">
											<Trash2 size={20} />
										</button>
									)}
								</div>
							))
						)}
					</div>
				</div>

				<div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
					<button
						type="button"
						onClick={onClose}
						className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={async () => {
							setIsLoading(true);
							console.log('track A ENVIAR', localTrack);
							try {
								if (localTrack?.external_id) {
									// Crear FormData para enviar el archivo
									const formData = new FormData();

									// Añadir el archivo si existe
									if (selectedFile) {
										formData.append('file', selectedFile);
									}

									if (selectedFileDolby) {
										formData.append('dolby_file', selectedFileDolby);
									}

									// Añadir el resto de los datos del track
									Object.keys(localTrack).forEach(key => {
										if (key !== 'resource') {
											const value = localTrack[key as keyof typeof localTrack];
											if (value !== undefined) {
												formData.append(key, JSON.stringify(value));
											}
										}
									});
									console.log('formData', formData);
									// Si tiene external_id, actualizar el track existente
									const response = await fetch(
										`/api/admin/updateSingle/${localTrack.external_id}`,
										{
											method: 'PUT',
											body: formData, // Enviar FormData en lugar de JSON
										}
									);

									if (!response.ok) {
										throw new Error('Error al actualizar el track');
									}

									const data = await response.json();
									console.log('RESPUESTA UPDATE SINGLE', data);
									if (!data.success) {
										throw new Error(
											data.error || 'Error al actualizar el track'
										);
									}

									toast.success('Track actualizado correctamente');
								}
							} catch (error) {
								console.error('Error al guardar el track:', error);
								toast.error('Error al guardar el track');
							} finally {
								setIsLoading(false);
							}
						}}
						disabled={isLoading}
						className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-brand-light hover:bg-brand-dark rounded-md disabled:opacity-50"
					>
						{isLoading ? (
							<div className="flex items-center justify-center gap-1.5 sm:gap-2">
								<div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								<span>Guardando...</span>
							</div>
						) : (
							<div className="flex items-center justify-center gap-1.5 sm:gap-2">
								<Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
								<span>
									{localTrack?.external_id
										? 'Guardar cambios'
										: 'Crear borrador'}
								</span>
							</div>
						)}
					</button>
				</div>
			</form>

			{isCreateArtistModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-base sm:text-lg font-medium text-gray-900">
								Crear Nuevo Artista
							</h3>
							<button
								onClick={() => setIsCreateArtistModalOpen(false)}
								className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-full transition-colors"
							>
								<XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-xs sm:text-sm font-medium text-gray-700">
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
									className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
								/>
							</div>

							<div>
								<label className="block text-xs sm:text-sm font-medium text-gray-700">
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
									className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
										<div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center">
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
										className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
										<div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center">
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
										className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
										<div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
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
										className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
										<div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
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
										className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>
							</div>
						</div>

						<div className="mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
							<button
								onClick={() => setIsCreateArtistModalOpen(false)}
								className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
							>
								Cancelar
							</button>
							<button
								onClick={() => {
									// Crear el nuevo artista con la estructura requerida
									const newArtist = {
										order: (track?.artists || []).length,
										artist: 0, // ID temporal que se actualizará cuando se guarde en la base de datos
										name: newArtistData.name,
										kind: 'main',
										email: newArtistData.email,
										amazon_music_identifier: newArtistData.amazon_music_id,
										apple_identifier: newArtistData.apple_music_id,
										deezer_identifier: newArtistData.deezer_id,
										spotify_identifier: newArtistData.spotify_id,
									};

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
								className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-brand-light hover:bg-brand-dark rounded-md transition-colors"
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
