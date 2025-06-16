import React, { useState, useEffect, useRef } from 'react';
import { X, Save, XCircle, Plus, Trash2, Upload, Image } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-clock/dist/Clock.css';
import Cleave from 'cleave.js/react';
import 'cleave.js/dist/addons/cleave-phone.us';
import Select, { SingleValue } from 'react-select';
import { Track } from '@/types/track';
import { LANGUAGES, VOCALS, LanguageOption } from '@/constants/languages';
import CustomSwitch from './CustomSwitch';
import TrackArtistSelector from './TrackArtistSelector';
import type { TrackArtist, TrackNewArtist } from './TrackArtistSelector';
import NextImage from 'next/image';
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
	artist: number;
	kind: string;
	order: number;
	name: string;
	isNew?: boolean;
}

interface Contributor {
	contributor: number;
	role: number;
	order: number;
	name: string;
	role_name: string;
}

interface ContributorData {
	external_id: number;
	name: string;
}
interface Publisher {
	[x: string]: any;
	publisher: number;
	author: string;
	order: number;
	name: string;
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
	isAsset?: boolean;
}

interface NewArtistData {
	artist: number;
	kind: 'main' | 'featuring' | 'remixer';
	order: number;
	name: string;
	email: string;
	amazon_music_identifier: string;
	apple_identifier: string;
	deezer_identifier: string;
	spotify_identifier: string;
	isNew?: boolean;
}

interface NewPublisher {
	publisher: number;
	email: string;
	author: string;
	order: number;
	name: string;
}

interface TrackData {
	external_id: string | number;
	order: number;
	release: string | number;
	status: string;
	name: string;
	artists: Artist[];
	language: string;
	vocals: string;
	sample_start: string;
	label_share: string | number;
	copyright_holder: string;
	copyright_holder_year: string;
	contributors: Contributor[];
	publishers: Publisher[];
	newArtists: NewArtistData[];
	ISRC: string;
	generate_isrc: boolean;
	DA_ISRC: string;
	genre: number;
	genre_name: string;
	subgenre: number;
	subgenre_name: string;
	mix_name: string;
	resource: string | File;
	dolby_atmos_resource: string | File;
	album_only: boolean;
	explicit_content: boolean;
	track_length: string;
	available: boolean;
	newContributors: NewContributor[];
	newPublishers: NewPublisher[];
}

interface NewContributor {
	name: string;
	role: number;
	role_name: string;
	order: number;
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
	genres,
	onClose,
	isAsset,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [contributors, setContributors] = useState<ContributorData[]>([]);
	const [publishers, setPublishers] = useState<Publisher[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [artistsError, setArtistsError] = useState<string[]>([]);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [selectedFileDolby, setSelectedFileDolby] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [subgenres, setSubgenres] = useState<Subgenre[]>([]);
	const [newArtistData, setNewArtistData] = useState<NewArtistData>({
		artist: 0,
		kind: 'main',
		order: 0,
		name: '',
		email: '',
		amazon_music_identifier: '',
		apple_identifier: '',
		deezer_identifier: '',
		spotify_identifier: '',
	});
	const [localTrack, setLocalTrack] = useState<TrackData>({
		order: 0,
		external_id: track?.external_id || 0,
		release: track?.release || 0,
		status: track?.status || '',
		name: track?.name || '',
		mix_name: track?.mix_name || '',
		vocals: track?.vocals || '',
		language: track?.language || '',
		artists: track?.artists || [],
		contributors: track?.contributors || [],
		publishers: track?.publishers || [],
		label_share: track?.label_share || '',
		genre: track?.genre || 0,
		genre_name: track?.genre_name || '',
		subgenre: track?.subgenre || 0,
		subgenre_name: track?.subgenre_name || '',
		resource: track?.resource || '',
		dolby_atmos_resource: track?.dolby_atmos_resource || '',
		copyright_holder: track?.copyright_holder || '',
		copyright_holder_year: track?.copyright_holder_year || '',
		album_only: track?.album_only || false,
		sample_start: track?.sample_start || '',
		explicit_content: track?.explicit_content || false,
		ISRC: track?.ISRC || '',
		generate_isrc: track?.generate_isrc || true,
		DA_ISRC: track?.DA_ISRC || '',
		track_length: track?.track_length || '',
		available: track?.available || true,
		newArtists: [],
		newContributors: [],
		newPublishers: [],
	});
	const [contributorError, setContributorError] = useState<string[]>([]);
	const [isCreateArtistModalOpen, setIsCreateArtistModalOpen] = useState(false);
	const [isCreatePublisherModalOpen, setIsCreatePublisherModalOpen] =
		useState(false);

	const [newPublishers, setNewPublishers] = useState<{
		name: string;
		author: string;
		email: string;
	}>({
		name: '',
		author: '',
		email: '',
	});

	const [newContributorData, setNewContributorData] = useState<{
		name: string;
		email: string;
	}>({
		name: '',
		email: '',
	});
	const [isCreateContributorModalOpen, setIsCreateContributorModalOpen] =
		useState(false);

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

				const contributorRes = await fetch(
					'/api/admin/getAllContributor?all=true'
				);
				const contributorData = await contributorRes.json();
				if (contributorData.success) {
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

	const handleRemovePublisher = (indexToRemove: number) => {
		setLocalTrack(prev => {
			// Determinar si el índice corresponde a un publisher existente o nuevo
			const publishersLength = prev.publishers?.length || 0;
			const isNewPublisher = indexToRemove >= publishersLength;

			if (isNewPublisher) {
				// Eliminar de newPublishers
				const newPublishers = (prev.newPublishers || []).filter(
					(_, index) => index !== indexToRemove - publishersLength
				);
				return {
					...prev,
					newPublishers: newPublishers.map((publisher, index) => ({
						...publisher,
						order: publishersLength + index, // El order continúa desde donde terminó publishers
					})),
				};
			} else {
				// Eliminar de publishers
				const publishers = (prev.publishers || []).filter(
					(_, index) => index !== indexToRemove
				);
				// Reordenar publishers existentes
				const updatedPublishers = publishers.map((publisher, index) => ({
					...publisher,
					order: index,
				}));
				// Reordenar newPublishers para mantener la secuencia
				const updatedNewPublishers = (prev.newPublishers || []).map(
					(publisher, index) => ({
						...publisher,
						order: updatedPublishers.length + index,
					})
				);
				return {
					...prev,
					publishers: updatedPublishers,
					newPublishers: updatedNewPublishers,
				};
			}
		});
	};

	const handlePublisherChange = (
		index: number,
		field: 'publisher' | 'author' | 'order',
		value: string | number
	) => {
		if (field === 'order') {
			setLocalTrack(prev => {
				const newPublishers = [...(prev.publishers || [])];
				const currentPublisher = newPublishers[index];
				const newOrder = Number(value);

				// Si el nuevo orden es mayor que el número total de publishers, ajustarlo
				if (newOrder >= newPublishers.length) {
					value = newPublishers.length - 1;
				}

				// Si el nuevo orden es negativo, ajustarlo a 0
				if (newOrder < 0) {
					value = 0;
				}

				// Reordenar todos los publishers
				newPublishers.splice(index, 1); // Remover el publisher de su posición actual
				newPublishers.splice(Number(value), 0, currentPublisher); // Insertar en la nueva posición

				// Actualizar los órdenes de todos los publishers
				return {
					...prev,
					publishers: newPublishers.map((publisher, idx) => ({
						...publisher,
						order: idx,
					})),
				};
			});
		} else {
			setLocalTrack(prev => {
				// Determinar si el índice corresponde a un publisher existente o nuevo
				const publishersLength = prev.publishers?.length || 0;
				const isNewPublisher = index >= publishersLength;

				if (isNewPublisher) {
					// Actualizar newPublishers
					const newPublishers = [...(prev.newPublishers || [])];
					const actualIndex = index - publishersLength;
					newPublishers[actualIndex] = {
						...newPublishers[actualIndex],
						[field]: value,
					};
					return {
						...prev,
						newPublishers,
					};
				} else {
					// Actualizar publishers
					const trackPublishers = [...(prev.publishers || [])];
					if (field === 'publisher') {
						// Si estamos actualizando el publisher, también actualizamos el nombre
						const selectedPublisher = publishers.find(
							p => p.external_id === Number(value)
						);
						trackPublishers[index] = {
							...trackPublishers[index],
							publisher: Number(value),
							name: selectedPublisher?.name || '',
							order: index, // Aseguramos que el order sea consistente con el índice
						};
					} else {
						trackPublishers[index] = {
							...trackPublishers[index],
							[field]: value as string,
						};
					}
					return {
						...prev,
						publishers: trackPublishers,
					};
				}
			});
		}
	};

	// Modificar el botón de agregar publisher para asignar el order correctamente
	const handleAddPublisher = () => {
		const maxOrder = Math.max(
			...(localTrack?.publishers || []).map((p: { order: number }) => p.order),
			...(localTrack?.newPublishers || []).map(
				(p: { order: number }) => p.order
			),
			-1
		);
		const newPublisher: Publisher = {
			publisher: 0,
			name: '',
			author: '',
			order: maxOrder + 1,
		};
		setLocalTrack(prev => ({
			...prev,
			publishers: [...(prev.publishers || []), newPublisher],
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
	const handleSave = async (e: any) => {
		e.preventDefault();
		setIsLoading(true);
		setContributorError([]);
		setArtistsError([]);
		try {
			if (localTrack?.external_id) {
				// Crear FormData para enviar el archivo
				const formData = new FormData();
				if (localTrack.contributors.some(c => !c.role)) {
					toast.error('Error en contributors');
					setContributorError(prev => [
						...prev,
						'Todos los Contributors deben de tener un rol seleccionado',
					]);
				}
				if (
					localTrack.vocals !== 'ZXX' &&
					!localTrack.contributors.some(c => c.role_name === 'Lyricist')
				) {
					toast.error('Error en contributors');
					setContributorError(prev => [
						...prev,
						'Si Vocals no es instrumental, al menos un Contributor debe de tener el rol de Lyricist',
					]);
				}
				if (!localTrack.contributors.some(c => c.role_name === 'Composer')) {
					toast.error('Error en contributors');
					setContributorError(prev => [
						...prev,
						'Al menos un Contributor debe de tener el rol de Composer',
					]);
				}
				if (!localTrack.artists.some(c => c.kind === 'main')) {
					toast.error('Error en artists');
					setArtistsError(prev => [
						...prev,
						'Al menos un artista debe de tener el rol de Principal',
					]);
				}
				if (contributorError.length > 0 || artistsError.length > 0) {
					toast.error('Error: faltan datos');
					return;
				}
				// Añadir el archivo si existe
				if (selectedFile) {
					formData.append('file', selectedFile);
				}

				if (selectedFileDolby) {
					formData.append('dolby_file', selectedFileDolby);
				}

				// Añadir el resto de los datos del track
				formData.append('data', JSON.stringify(localTrack));

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

				if (!data.success) {
					throw new Error(data.error || 'Error al actualizar el track');
				}

				toast.success('Track actualizado correctamente');
			}
		} catch (error) {
			console.error('Error al guardar el track:', error);
			toast.error('Error al guardar el track');
		} finally {
			setIsLoading(false);
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
			<div className="relative">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-medium text-gray-900">
						{track ? 'Editar Track' : 'Nuevo Track'}
					</h3>
					{isAsset && (
						<button
							onClick={onClose}
							className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
						>
							<X className="w-6 h-6" />
						</button>
					)}
				</div>
			</div>

			{error && (
				<div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
					{error}
				</div>
			)}

			<form className="space-y-8">
				{/* Sección de Archivo y Recursos */}
				<div>
					<div className="flex pb-6 items-start ">
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

							{(selectedFile || track?.resource) && (
								<div className="mt-4 p-3 md:p-4 w-1/2 bg-white rounded-lg border border-gray-200 shadow-sm">
									<div className="flex items-center gap-2 md:gap-3">
										<div className="p-1.5 md:p-2 bg-gray-100 rounded-lg">
											<Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">
												{selectedFile
													? selectedFile.name
													: typeof track?.resource === 'string'
													? track.resource
													: track?.resource?.name}
											</p>
											<p className="text-xs text-gray-500">
												{selectedFile
													? 'Listo para subir'
													: typeof track?.resource === 'string'
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

							{(selectedFileDolby || track?.dolby_atmos_resource) && (
								<div className="mt-4 p-3 md:p-4 w-1/2 bg-white rounded-lg border border-gray-200 shadow-sm">
									<div className="flex items-center gap-2 md:gap-3">
										<div className="p-1.5 md:p-2 bg-gray-100 rounded-lg">
											<Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">
												{selectedFileDolby
													? selectedFileDolby.name
													: typeof track?.dolby_atmos_resource === 'string'
													? track.dolby_atmos_resource
													: track?.dolby_atmos_resource?.name}
											</p>
											<p className="text-xs text-gray-500">
												{selectedFileDolby
													? 'Listo para subir'
													: typeof track?.dolby_atmos_resource === 'string'
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
					{track?.qc_feedback && Object.keys(track.qc_feedback).length > 0 && (
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
								value={localTrack.order}
								onKeyPress={e => {
									if (!/[0-9]/.test(e.key)) {
										e.preventDefault();
									}
								}}
								className="w-full md:w-20 p-2 border rounded"
								placeholder="0"
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
							onClick={e => {
								e.preventDefault();
								e.stopPropagation();
								setIsCreateArtistModalOpen(true);
							}}
							className="p-2.5 text-brand-light hover:text-brand-dark rounded-full hover:bg-gray-50 transition-colors"
						>
							<Plus size={20} />
						</button>
					</div>
					{artistsError.length > 0 && (
						<div className="text-red-500 text-sm">
							{artistsError.map((error, index) => (
								<p key={index}>{error}</p>
							))}
						</div>
					)}
					<div className="space-y-4 w-full overflow-hidden">
						<TrackArtistSelector
							artists={(localTrack?.artists || []).map(artist => ({
								...artist,
								kind: artist.kind as 'main' | 'featuring' | 'remixer',
							}))}
							newArtists={localTrack?.newArtists || []}
							artistData={
								artists?.map(a => ({
									artist: a?.artist || 0,
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
							onNewArtistsChange={(newArtists: TrackNewArtist[]) => {
								setLocalTrack(prev => ({
									...prev,
									newArtists: newArtists,
								}));
							}}
							onDeleteArtist={(index: number) => {
								const newArtists = [...(localTrack?.artists || [])];
								newArtists.splice(index, 1);
								setLocalTrack(prev => ({
									...prev,
									artists: newArtists,
								}));
							}}
							onDeleteNewArtist={(index: number) => {
								const newArtists = [...(localTrack?.newArtists || [])];
								newArtists.splice(index, 1);
								setLocalTrack(prev => ({
									...prev,
									newArtists: newArtists,
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
					{contributorError.length > 0 && (
						<div className="text-red-500 text-sm">
							{contributorError.map((error, index) => (
								<p key={index}>{error}</p>
							))}
						</div>
					)}
					<div className="space-y-4 w-full overflow-hidden">
						<ContributorSelector
							contributors={localTrack.contributors || []}
							newContributors={localTrack.newContributors || []}
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
							onNewContributorsChange={newContributors => {
								const updatedNewContributors = newContributors.map(
									contributor => {
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
									}
								);

								setLocalTrack(prev => ({
									...prev,
									newContributors: updatedNewContributors,
								}));
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
							onDeleteNewContributor={index => {
								const newContributors = [...(localTrack.newContributors || [])];
								newContributors.splice(index, 1);
								setLocalTrack(prev => ({
									...prev,
									newContributors: newContributors,
								}));
							}}
							onCreateNewContributor={name => {
								setNewContributorData(prev => ({ ...prev, name }));
								setIsCreateContributorModalOpen(true);
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
						<button
							type="button"
							onClick={handleAddPublisher}
							className="p-2.5 text-brand-light hover:text-brand-dark rounded-full hover:bg-gray-50 transition-colors"
						>
							<Plus size={20} />
						</button>
					</div>
					<div className="space-y-4 overflow-hidden">
						{!localTrack?.publishers?.length ? (
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-2">
								<div className="w-full sm:w-1/2 sm:max-w-[50%]">
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
										options={[
											...publishers.map(p => ({
												value: p.external_id,
												label: p.name,
											})),
											...(localTrack?.newPublishers || []).map(p => ({
												value: p.publisher,
												label: p.name,
											})),
										]}
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
										isSearchable={true}
										components={{
											NoOptionsMessage: ({ inputValue }: any) => (
												<div className="p-2 text-center">
													<p className="text-sm text-gray-500 mb-2">
														No se encontraron publishers para "{inputValue}"
													</p>
													<button
														onClick={e => {
															e.preventDefault();
															e.stopPropagation();
															setNewPublishers(prev => ({
																...prev,
																name: inputValue || '',
															}));
															setIsCreatePublisherModalOpen(true);
															// Eliminar la fila vacía actual
															setLocalTrack(prev => ({
																...prev,
																publishers: prev.publishers.filter(
																	(p, i) => i !== inputValue
																),
															}));
														}}
														className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-500 bg-neutral-100 hover:text-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
													>
														<Plus className="w-4 h-4 mr-1" />
														Crear nuevo publisher
													</button>
												</div>
											),
										}}
									/>
								</div>

								<div className="flex w-full max-w-[50%] items-center gap-2">
									<input
										type="text"
										name="author"
										value={localTrack?.publishers?.[0]?.author || ''}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											handlePublisherChange(0, 'author', e.target.value);
										}}
										className="w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:brand-dark focus:outline-none focus:ring-0"
										placeholder="Autor"
									/>
								</div>
							</div>
						) : (
							[
								...(localTrack?.publishers || []),
								...(localTrack?.newPublishers || []),
							].map((publisher, index) => (
								<div
									key={`publisher-row-${index}`}
									className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-2"
								>
									<div className="w-full sm:w-1/2 sm:max-w-[50%]">
										{publisher.publisher === 0 && publisher.name ? (
											<div className="px-3 py-2 text-sm text-gray-700">
												{publisher.name}
											</div>
										) : (
											<Select
												value={
													publisher?.publisher
														? {
																value: publisher.publisher,
																label:
																	publisher.name ||
																	publishers.find(
																		p => p.external_id === publisher.publisher
																	)?.name ||
																	'',
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
												options={[
													...publishers.map(p => ({
														value: p.external_id,
														label: p.name,
													})),
													...(localTrack?.newPublishers || []).map(p => ({
														value: p.publisher,
														label: p.name,
													})),
												]}
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
												isSearchable={true}
												components={{
													NoOptionsMessage: ({ inputValue }: any) => (
														<div className="p-2 text-center">
															<p className="text-sm text-gray-500 mb-2">
																No se encontraron publishers
															</p>
															<button
																onClick={e => {
																	e.preventDefault();
																	e.stopPropagation();
																	setNewPublishers(prev => ({
																		...prev,
																		name: inputValue || '',
																	}));
																	setIsCreatePublisherModalOpen(true);
																	// Eliminar la fila vacía actual
																	setLocalTrack(prev => ({
																		...prev,
																		publishers: prev.publishers.filter(
																			(p, i) => i !== index
																		),
																	}));
																}}
																className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-500 bg-neutral-100 hover:text-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
															>
																<Plus className="w-4 h-4 mr-1" />
																Crear nuevo publisher
															</button>
														</div>
													),
												}}
											/>
										)}
									</div>
									<div className="flex w-full max-w-[50%] items-center gap-2">
										<input
											type="text"
											value={publisher?.author || ''}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												handlePublisherChange(index, 'author', e.target.value);
											}}
											className="w-full border-0 border-b border-gray-300 px-2 py-1.5 focus:border-b focus:brand-dark focus:outline-none focus:ring-0"
											placeholder="Autor"
										/>
									</div>
									{(localTrack?.publishers || []).length > 0 && (
										<button
											type="button"
											onClick={() => handleRemovePublisher(index)}
											className="p-2.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
										>
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
						onClick={e => handleSave(e)}
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
											<NextImage
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
										value={newArtistData.amazon_music_identifier}
										onChange={e =>
											setNewArtistData(prev => ({
												...prev,
												amazon_music_identifier: e.target.value,
											}))
										}
										className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
										<div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center">
											<NextImage
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
										value={newArtistData.apple_identifier}
										onChange={e =>
											setNewArtistData(prev => ({
												...prev,
												apple_identifier: e.target.value,
											}))
										}
										className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
										<div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
											<NextImage
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
										value={newArtistData.deezer_identifier}
										onChange={e =>
											setNewArtistData(prev => ({
												...prev,
												deezer_identifier: e.target.value,
											}))
										}
										className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									/>
								</div>

								<div>
									<label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
										<div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
											<NextImage
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
										value={newArtistData.spotify_identifier}
										onChange={e =>
											setNewArtistData(prev => ({
												...prev,
												spotify_identifier: e.target.value,
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
									const maxOrder = Math.max(
										...(localTrack?.artists || []).map(a => a.order),
										...(localTrack?.newArtists || []).map(a => a.order),
										-1
									);
									const newArtist: NewArtistData = {
										order: maxOrder + 1,
										artist: 0, // ID temporal que se actualizará cuando se guarde en la base de datos
										name: newArtistData.name,
										kind: 'main' as const,
										email: newArtistData.email,
										amazon_music_identifier:
											newArtistData.amazon_music_identifier,
										apple_identifier: newArtistData.apple_identifier,
										deezer_identifier: newArtistData.deezer_identifier,
										spotify_identifier: newArtistData.spotify_identifier,
										isNew: true,
									};
									setLocalTrack((prev: TrackData) => ({
										...prev,
										newArtists: [...(prev.newArtists || []), newArtist],
									}));
									// Limpiar el formulario y cerrar el modal
									setNewArtistData({
										artist: 0,
										kind: 'main',
										order: 0,
										name: '',
										email: '',
										amazon_music_identifier: '',
										apple_identifier: '',
										deezer_identifier: '',
										spotify_identifier: '',
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

			{isCreatePublisherModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-6 w-full max-w-md">
						<h2 className="text-xl font-semibold mb-4">
							Crear nuevo Publisher
						</h2>

						{error && (
							<div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
								{error}
							</div>
						)}

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Nombre
								</label>
								<input
									type="text"
									value={newPublishers.name}
									onChange={e =>
										setNewPublishers(prev => ({
											...prev,
											name: e.target.value,
										}))
									}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-light focus:ring-brand-light"
									disabled={isLoading}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Email
								</label>
								<input
									type="email"
									value={newPublishers.email}
									onChange={e =>
										setNewPublishers(prev => ({
											...prev,
											email: e.target.value,
										}))
									}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-light focus:ring-brand-light"
									disabled={isLoading}
								/>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-3">
							<button
								onClick={() => {
									setIsCreatePublisherModalOpen(false);
									setNewPublishers({ name: '', author: '', email: '' });
									setError('');
								}}
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
								disabled={isLoading}
							>
								Cancelar
							</button>
							<button
								onClick={() => {
									// Crear el nuevo publisher con la estructura requerida
									const maxOrder = Math.max(
										...(localTrack?.publishers || []).map(
											(p: { order: number }) => p.order
										),
										...(localTrack?.newPublishers || []).map(
											(p: { order: number }) => p.order
										),
										-1
									);
									const newPublisher: NewPublisher = {
										publisher: 0, // Volvemos a usar 0 para nuevos publishers creados
										email: newPublishers.email,
										name: newPublishers.name,
										author: newPublishers.author,
										order: maxOrder + 1,
									};

									setLocalTrack(prev => {
										const updatedTrack = {
											...prev,
											newPublishers: [
												...(prev.newPublishers || []),
												newPublisher,
											],
										};

										return updatedTrack;
									});

									// Limpiar el formulario y cerrar el modal
									setNewPublishers({ name: '', author: '', email: '' });
									setIsCreatePublisherModalOpen(false);
									setError('');
								}}
								className="px-4 py-2 text-sm font-medium text-white bg-brand-light hover:bg-brand-dark rounded-md disabled:opacity-50"
								disabled={isLoading}
							>
								{isLoading ? 'Creando...' : 'Crear'}
							</button>
						</div>
					</div>
				</div>
			)}

			{isCreateContributorModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-medium text-gray-900">
								Crear Nuevo Contribuidor
							</h3>
							<button
								onClick={() => setIsCreateContributorModalOpen(false)}
								className="text-gray-400 hover:text-gray-500"
							>
								<XCircle className="h-6 w-6" />
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="block text-xs sm:text-sm font-medium text-gray-700">
									Nombre
								</label>
								<input
									type="text"
									value={newContributorData.name}
									onChange={e =>
										setNewContributorData(prev => ({
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
									value={newContributorData.email}
									onChange={e =>
										setNewContributorData(prev => ({
											...prev,
											email: e.target.value,
										}))
									}
									className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
								/>
							</div>
						</div>

						<div className="mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
							<button
								onClick={() => setIsCreateContributorModalOpen(false)}
								className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
							>
								Cancelar
							</button>
							<button
								onClick={() => {
									// Crear el nuevo contribuidor con la estructura requerida
									const maxOrder = Math.max(
										...(localTrack?.contributors || []).map(c => c.order),
										...(localTrack?.newContributors || []).map(c => c.order),
										-1
									);
									const newContributor = {
										name: newContributorData.name,
										email: newContributorData.email,
										role: 0,
										role_name: '',
										order: maxOrder + 1,
										isNew: true,
									};

									setLocalTrack(prev => ({
										...prev,
										newContributors: [
											...(prev.newContributors || []),
											newContributor,
										],
									}));

									// Limpiar el formulario y cerrar el modal
									setNewContributorData({ name: '', email: '' });
									setIsCreateContributorModalOpen(false);
								}}
								className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-brand-light hover:bg-brand-dark rounded-md transition-colors"
							>
								Crear Contribuidor
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TrackForm;
