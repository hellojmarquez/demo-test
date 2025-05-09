import React, { useState, useEffect } from 'react';
import { X, Save, XCircle, Plus, Trash2, Upload } from 'lucide-react';
import { Track } from '@/types/track';
import Cleave from 'cleave.js/react';
import 'cleave.js/dist/addons/cleave-phone.us';
import Select from 'react-select';

interface Artist {
	_id: string;
	external_id: string;
	name: string;
	role: string;
}

interface Contributor {
	contributor: number;
	name: string;
	role: number;
	order: number;
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
	_id: string;
	name: string;
	picture: {
		base64: string;
	};
}

interface Genre {
	id: number;
	name: string;
	subgenres: Subgenre[];
}

interface Subgenre {
	id: number;
	name: string;
}

interface TrackContributor {
	external_id: number;
	name: string;
	role: number;
	order: number;
}

interface UpdateTrackModalProps {
	track: Track;
	isOpen: boolean;
	onClose: () => void;
	onSave: (updatedTrack: Track) => void;
}

const UpdateTrackModal: React.FC<UpdateTrackModalProps> = ({
	track,
	isOpen,
	onClose,
	onSave,
}: UpdateTrackModalProps): JSX.Element | null => {
	const [isLoading, setIsLoading] = useState(true);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [contributors, setContributors] = useState<Contributor[]>([]);
	const [publishers, setPublishers] = useState<Publisher[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [releases, setReleases] = useState<Release[]>([]);
	const [genres, setGenres] = useState<Genre[]>([]);
	const [subgenres, setSubgenres] = useState<Subgenre[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [currentGenreId, setCurrentGenreId] = useState<number | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [formData, setFormData] = useState<Track>({
		...track,
		release: track.release || '',
		language: track.language || '',
		order: track.order ?? 0,
		name: track.name || '',
		mix_name: track.mix_name || '',
		DA_ISRC: track.DA_ISRC || '',
		ISRC: track.ISRC || '',
		copyright_holder: track.copyright_holder || '',
		copyright_holder_year: track.copyright_holder_year || '',
		dolby_atmos_resource: track.dolby_atmos_resource || '',
		label_share: track.label_share ?? null,
		resource: track.resource || null,
		sample_start: track.sample_start || '',
		track_lenght: track.track_lenght || '',
		vocals: track.vocals || '',
		genre: {
			id: typeof track.genre === 'number' ? track.genre : track.genre?.id || 0,
			name: typeof track.genre === 'number' ? '' : track.genre?.name || '',
		},
		subgenre: {
			id:
				typeof track.subgenre === 'number'
					? track.subgenre
					: track.subgenre?.id || 0,
			name:
				typeof track.subgenre === 'number' ? '' : track.subgenre?.name || '',
		},
		artists: track.artists.map(artist => ({
			...artist,
			artist: Number(artist.artist) || 0,
			kind: artist.kind || '',
			order: Number(artist.order) || 0,
			name: artist.name || '',
		})),
		contributors: track.contributors.map(contributor => ({
			contributor: Number(contributor.contributor) || 0,
			name: contributor.name || '',
			role: Number(contributor.role) || 0,
			order: Number(contributor.order) || 0,
			role_name: contributor.role_name || '',
		})),
		publishers: track.publishers.map(publisher => ({
			publisher: Number(publisher.publisher) || 0,
			author: publisher.author || '',
			order: Number(publisher.order) || 0,
		})),
	});

	useEffect(() => {
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

				// Fetch artists
				const artistsRes = await fetch('/api/admin/getAllArtists');
				const artistsData = await artistsRes.json();
				if (artistsData.success) {
					// Filter artists to only include those with role 'artista'
					const filteredArtists = artistsData.data.filter(
						(user: any) => user.role === 'artista'
					);
					setArtists(filteredArtists);

					// Update formData with artist names
					setFormData(prev => ({
						...prev,
						artists: prev.artists.map(artist => ({
							...artist,
							name:
								artist.name ||
								filteredArtists.find(
									(a: Artist) => a.external_id === String(artist.artist)
								)?.name ||
								'',
						})),
					}));

					// Filter contributors from the same response
					const filteredContributors = artistsData.data.filter(
						(user: any) => user.role === 'contributor'
					);
					setContributors(filteredContributors);

					// Filter publishers from the same response
					const filteredPublishers = artistsData.data
						.filter((user: any) => user.role === 'publisher')
						.map((p: { external_id: string; name: string; role: string }) => ({
							external_id: parseInt(p.external_id),
							name: p.name,
							role: p.role,
						}));

					setPublishers(filteredPublishers);
				}

				// Fetch roles
				const rolesRes = await fetch('/api/admin/getContributorRoles');
				const rolesData = await rolesRes.json();
				if (rolesData.success) {
					setRoles(rolesData.data);
				}

				// Fetch genres
				try {
					const genresRes = await fetch('/api/admin/getAllGenres');
					const genresData = await genresRes.json();

					if (genresData.success && Array.isArray(genresData.data)) {
						setGenres(genresData.data);

						// Buscar el género actual del track en la lista de géneros
						if (track.genre) {
							const genreById = genresData.data.find(
								(g: Genre) =>
									g.id ===
									(typeof track.genre === 'number'
										? track.genre
										: track.genre.id)
							);
							if (genreById) {
								setCurrentGenreId(genreById.id);
								setFormData(prev => ({
									...prev,
									genre: {
										id: genreById.id,
										name: genreById.name,
									},
								}));

								// Buscar el subgénero actual en los subgéneros del género
								if (track.subgenre && genreById.subgenres) {
									const subgenreById = genreById.subgenres.find(
										(s: Subgenre) =>
											s.id ===
											(typeof track.subgenre === 'number'
												? track.subgenre
												: track.subgenre.id)
									);
									if (subgenreById) {
										setFormData(prev => ({
											...prev,
											subgenre: {
												id: subgenreById.id,
												name: subgenreById.name,
											},
										}));
									}
								}
							} else {
								const genreByName = genresData.data.find(
									(g: Genre) =>
										g.name ===
										(typeof track.genre === 'number'
											? String(track.genre)
											: track.genre.name)
								);
								if (genreByName) {
									setCurrentGenreId(genreByName.id);
									setFormData(prev => ({
										...prev,
										genre: {
											id: genreByName.id,
											name: genreByName.name,
										},
									}));

									// Buscar el subgénero actual en los subgéneros del género
									if (track.subgenre && genreByName.subgenres) {
										const subgenreById = genreByName.subgenres.find(
											(s: Subgenre) =>
												s.id ===
												(typeof track.subgenre === 'number'
													? track.subgenre
													: track.subgenre.id)
										);
										if (subgenreById) {
											setFormData(prev => ({
												...prev,
												subgenre: {
													id: subgenreById.id,
													name: subgenreById.name,
												},
											}));
										}
									}
								}
							}
						}
					} else {
						setError(
							'Error al cargar los géneros. Formato de respuesta inesperado.'
						);
					}
				} catch (genreError) {
					console.error('Error específico al cargar géneros:', genreError);
				}
			} catch (err) {
				console.error('Error fetching data:', err);
				setError('Error al cargar los datos. Por favor, inténtalo de nuevo.');
			} finally {
				setIsLoading(false);
			}
		};

		if (isOpen) {
			fetchData();
		}
	}, [isOpen, track.genre, track.subgenre]);

	useEffect(() => {
		if (track) {
			setFormData({
				...track,
				publishers: track.publishers.map(publisher => ({
					publisher: Number(publisher.publisher) || 0,
					author: publisher.author || '',
					order: Number(publisher.order) || 0,
				})),
			});
		}
	}, [track]);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value, type } = e.target;
		if (type === 'checkbox') {
			const checkbox = e.target as HTMLInputElement;
			setFormData(prev => ({
				...prev,
				[name]: checkbox.checked,
			}));
		} else if (name === 'genre') {
			// Manejo especial para el cambio de género
			const genreId = parseInt(value);
			const selectedGenre = genres.find(g => g.id === genreId);
			setFormData(prev => ({
				...prev,
				genre: {
					id: genreId,
					name: selectedGenre ? selectedGenre.name : '',
				},
				// Reset subgenre when genre changes
				subgenre: {
					id: 0,
					name: '',
				},
			}));
		} else if (name === 'subgenre') {
			// Manejo especial para el cambio de subgénero
			const subgenreId = parseInt(value);
			const currentGenre = genres.find(g => g.id === formData.genre.id);
			const selectedSubgenre = currentGenre?.subgenres?.find(
				s => s.id === subgenreId
			);
			setFormData(prev => ({
				...prev,
				subgenre: {
					id: subgenreId,
					name: selectedSubgenre ? selectedSubgenre.name : '',
				},
			}));
		} else {
			setFormData(prev => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleAddArtist = () => {
		setFormData(prev => ({
			...prev,
			artists: [
				...prev.artists,
				{ artist: 0, kind: '', order: prev.artists.length, name: '' },
			],
		}));
	};

	const handleAddContributor = () => {
		setFormData(prev => ({
			...prev,
			contributors: [
				...prev.contributors,
				{
					contributor: 0,
					name: '',
					role: 0,
					order: prev.contributors.length,
					role_name: '',
				},
			],
		}));
	};

	const handleAddPublisher = () => {
		setFormData(prev => ({
			...prev,
			publishers: [
				...prev.publishers,
				{ publisher: 0, author: '', order: prev.publishers.length },
			],
		}));
	};

	const handleRemoveArtist = (index: number) => {
		setFormData(prev => ({
			...prev,
			artists: prev.artists.filter((_, i) => i !== index),
		}));
	};

	const handleRemoveContributor = (index: number) => {
		setFormData(prev => ({
			...prev,
			contributors: prev.contributors.filter((_, i) => i !== index),
		}));
	};

	const handleRemovePublisher = (index: number) => {
		setFormData(prev => ({
			...prev,
			publishers: prev.publishers.filter((_, i) => i !== index),
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
				newArtists[index] = { artist: 0, kind: '', order: 0, name: '' };
			}

			if (field === 'artist' && typeof value === 'string') {
				const selectedArtist = artists.find(a => a.external_id === value);
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

	const getValidStringValue = (value: any): string => {
		if (value === null || value === undefined) return '';
		const num = Number(value);
		return isNaN(num) ? '' : String(num);
	};

	const handleContributorChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		console.log(`handleContributorChange (${field}) - Valor recibido:`, value);
		console.log(
			`handleContributorChange (${field}) - Tipo del valor:`,
			typeof value
		);

		setFormData(prev => {
			const newContributors = [...prev.contributors];

			// Inicializar el objeto si no existe
			if (!newContributors[index]) {
				newContributors[index] = {
					contributor: 0,
					name: '',
					role: 0,
					order: 0,
					role_name: '',
				};
			}

			// Manejo para campo 'name'
			if (field === 'name') {
				if (value === '' || value === null || value === undefined) {
					return prev;
				}
				const selectedContributor = contributors.find(c => c.name === value);
				if (selectedContributor) {
					newContributors[index].name = selectedContributor.name;
					newContributors[index].contributor = selectedContributor.contributor;
				}
			}
			// Manejo para campo 'role'
			else if (field === 'role') {
				if (value === '' || value === null || value === undefined) {
					return prev;
				}
				const numValue =
					typeof value === 'string' ? parseInt(value, 10) : Number(value);
				if (!isNaN(numValue)) {
					newContributors[index].role = numValue;
				}
			}
			// Manejo para campo 'order'
			else if (field === 'order') {
				if (value === '' || value === null || value === undefined) {
					return prev;
				}
				const numValue =
					typeof value === 'string' ? parseInt(value, 10) : Number(value);
				if (!isNaN(numValue)) {
					newContributors[index].order = numValue;
				}
			}

			console.log('Updated contributors:', newContributors);
			return { ...prev, contributors: newContributors };
		});
	};

	const handlePublisherChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newPublishers = [...prev.publishers];
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

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type === 'audio/wav' || file.name.endsWith('.wav')) {
				setSelectedFile(file);
				console.log(file);
				setFormData(prev => ({
					...prev,
					resource: file,
				}));
				setUploadProgress(0);
			} else {
				alert('Por favor, selecciona un archivo WAV válido');
				e.target.value = '';
			}
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setIsLoading(true);
		try {
			await onSave(formData);
			onClose();
		} catch (error) {
			console.error('Error saving track:', error);
		} finally {
			setIsLoading(false);
		}
	};

	if (!isOpen) return null;

	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden [&::-webkit-outer-spin-button]:hidden';

	const handleTimeChange = (name: string, value: string) => {
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
	};

	// Styles for react-select components
	const reactSelectStyles = {
		control: (base: any) => ({
			...base,
			border: 'none',
			borderBottom: '2px solid #E5E7EB',
			borderRadius: '0',
			boxShadow: 'none',
			backgroundColor: 'transparent',
			'&:hover': {
				borderBottom: '2px solid #4B5563',
			},
		}),
		option: (base: any, state: { isSelected: boolean }) => ({
			...base,
			backgroundColor: state.isSelected ? '#4B5563' : 'white',
			color: state.isSelected ? 'white' : '#1F2937',
			'&:hover': {
				backgroundColor: state.isSelected ? '#4B5563' : '#F3F4F6',
			},
		}),
		menu: (base: any) => ({
			...base,
			boxShadow: 'none',
			border: '1px solid #E5E7EB',
		}),
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">Editar Track</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full"
					>
						<X size={20} />
					</button>
				</div>

				{isLoading ? (
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-light"></div>
					</div>
				) : error ? (
					<div className="p-8 text-center text-red-500">
						<XCircle size={48} className="mx-auto mb-2" />
						<p>{error}</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="flex flex-col gap-2">
							<Select
								value={
									formData.release
										? {
												value: formData.release,
												label:
													releases.find(r => r._id === formData.release)
														?.name || '',
										  }
										: null
								}
								onChange={(selectedOption: any) => {
									if (selectedOption) {
										setFormData(prev => ({
											...prev,
											release: selectedOption.value || '',
										}));
									}
								}}
								options={releases.map(release => ({
									value: release._id || '',
									label: release.name || '',
								}))}
								placeholder="Seleccionar lanzamiento"
								styles={reactSelectStyles}
								isClearable
							/>

							{formData.release && (
								<div className="flex items-center gap-2 mb-2">
									{releases.find(r => r._id === formData.release)?.picture
										?.base64 && (
										<img
											src={`data:image/jpeg;base64,${
												releases.find(r => r._id === formData.release)?.picture
													?.base64
											}`}
											alt="Release cover"
											className="w-12 h-12 object-cover rounded"
										/>
									)}
									<span className="text-sm">
										{releases.find(r => r._id === formData.release)?.name || ''}
									</span>
								</div>
							)}
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
									Mix Name
								</label>
								<input
									type="text"
									name="mix_name"
									value={formData.mix_name}
									onChange={handleChange}
									className={inputStyles}
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
									className={inputStyles}
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
									className={inputStyles}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">
									Género
								</label>
								<Select
									value={
										formData.genre.id
											? {
													value: formData.genre.id,
													label: formData.genre.name,
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
											} as React.ChangeEvent<HTMLSelectElement>);
										}
									}}
									options={genres.map(genre => ({
										value: genre.id,
										label: genre.name,
									}))}
									placeholder="Seleccionar género"
									styles={reactSelectStyles}
									isClearable
								/>
								{formData.genre.name && (
									<p className="text-xs text-gray-500 mt-1">
										Género actual: {formData.genre.name}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">
									Subgénero
								</label>
								<Select
									value={
										formData.subgenre.id
											? {
													value: formData.subgenre.id,
													label: formData.subgenre.name,
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
											} as React.ChangeEvent<HTMLSelectElement>);
										}
									}}
									options={
										genres
											.find(g => g.id === formData.genre.id)
											?.subgenres?.map(subgenre => ({
												value: subgenre.id,
												label: subgenre.name,
											})) || []
									}
									placeholder="Seleccionar subgénero"
									styles={reactSelectStyles}
									isClearable
								/>
								{formData.subgenre.name && (
									<p className="text-xs text-gray-500 mt-1">
										Subgénero actual: {formData.subgenre.name}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">
									Idioma
								</label>
								<Select
									value={
										formData.language
											? {
													value: formData.language,
													label:
														formData.language === 'ES' ? 'Español' : 'English',
											  }
											: null
									}
									onChange={(selectedOption: any) => {
										if (selectedOption) {
											handleChange({
												target: {
													name: 'language',
													value: selectedOption.value,
												},
											} as React.ChangeEvent<HTMLSelectElement>);
										}
									}}
									options={[
										{ value: 'ES', label: 'Español' },
										{ value: 'EN', label: 'English' },
									]}
									placeholder="Seleccionar idioma"
									styles={reactSelectStyles}
									isClearable
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
									onChange={e =>
										handleTimeChange('track_lenght', e.target.value)
									}
									className={inputStyles}
									placeholder="00:00:00"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">
									Vocals
								</label>
								<Select
									value={
										formData.vocals
											? {
													value: formData.vocals,
													label:
														formData.vocals === 'ES' ? 'Español' : 'English',
											  }
											: null
									}
									onChange={(selectedOption: any) => {
										if (selectedOption) {
											handleChange({
												target: {
													name: 'vocals',
													value: selectedOption.value,
												},
											} as React.ChangeEvent<HTMLSelectElement>);
										}
									}}
									options={[
										{ value: 'ES', label: 'Español' },
										{ value: 'EN', label: 'English' },
									]}
									placeholder="Seleccionar idioma"
									styles={reactSelectStyles}
									isClearable
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
									className={inputStyles}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">
									Año de Copyright
								</label>
								<Select
									value={
										formData.copyright_holder_year
											? {
													value: formData.copyright_holder_year,
													label: formData.copyright_holder_year,
											  }
											: null
									}
									onChange={(selectedOption: any) => {
										if (selectedOption) {
											handleChange({
												target: {
													name: 'copyright_holder_year',
													value: selectedOption.value,
												},
											} as React.ChangeEvent<HTMLSelectElement>);
										}
									}}
									options={Array.from(
										{ length: new Date().getFullYear() - 1899 },
										(_, i) => {
											const year = new Date().getFullYear() - i;
											return {
												value: year.toString(),
												label: year.toString(),
											};
										}
									)}
									placeholder="Seleccionar año"
									styles={reactSelectStyles}
									isClearable
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">
									Label Share
								</label>
								<input
									type="text"
									name="label_share"
									value={formData.label_share?.toString() || ''}
									onChange={handleChange}
									className={inputStyles}
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
									className={inputStyles}
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
									onChange={e =>
										handleTimeChange('sample_start', e.target.value)
									}
									className={inputStyles}
									placeholder="00:00:00"
								/>
							</div>

							<div>
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
								{uploadProgress > 0 && (
									<div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
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
				)}
			</div>
		</div>
	);
};

export default UpdateTrackModal;
