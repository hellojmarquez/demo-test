import React, { useState, useEffect } from 'react';
import { X, Save, XCircle, Plus, Trash2, Upload } from 'lucide-react';

interface Artist {
	_id: string;
	external_id: string;
	name: string;
	role: string;
}

interface Contributor {
	external_id: number;
	name: string;
	role: number;
	order: number;
}

interface Publisher {
	id: number;
	name: string;
	publisher: number;
	author: string;
	order: number;
}

interface PublisherForm {
	publisher: number;
	author: string;
	order: number;
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

interface Track {
	_id: string;
	name: string;
	mix_name: string;
	DA_ISRC: string;
	ISRC: string;
	__v: number;
	album_only: boolean;
	artists: { artist: number; kind: string; order: number; name: string }[];
	contributors: TrackContributor[];
	copyright_holder: string;
	copyright_holder_year: string;
	createdAt: string;
	dolby_atmos_resource: string;
	explicit_content: boolean;
	generate_isrc: boolean;
	genre: {
		id: number;
		name: string;
	};
	subgenre: {
		id: number;
		name: string;
	};
	label_share: string;
	language: string;
	order: number | null;
	publishers: { publisher: number; author: string; order: number }[];
	release: string;
	resource: string | File | null;
	sample_start: string;
	track_lenght: string;
	updatedAt: string;
	vocals: string;
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
		label_share: track.label_share || '',
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
			external_id: Number(contributor.external_id) || 0,
			name: contributor.name || '',
			role: Number(contributor.role) || 0,
			order: Number(contributor.order) || 0,
		})),
		publishers: track.publishers.map(publisher => ({
			...publisher,
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
						.map((p: { id: string; name: string; role: string }) => ({
							id: parseInt(p.id),
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
				{ external_id: 0, name: '', role: 0, order: prev.contributors.length },
			],
		}));
	};

	const handleAddPublisher = () => {
		const newPublisher = {
			publisher: 0,
			author: '',
			order: formData.publishers.length,
		};
		setFormData(prev => ({
			...prev,
			publishers: [...prev.publishers, newPublisher],
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
					external_id: 0,
					name: '',
					role: 0,
					order: 0,
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
					newContributors[index].external_id = selectedContributor.external_id;
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
		setFormData(prev => ({
			...prev,
			publishers: prev.publishers.map((publisher, i) =>
				i === index ? { ...publisher, [field]: value } : publisher
			),
		}));
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
					<div className="p-8 text-center">
						<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
						<p className="mt-2 text-gray-600">Cargando datos...</p>
					</div>
				) : error ? (
					<div className="p-8 text-center text-red-500">
						<XCircle size={48} className="mx-auto mb-2" />
						<p>{error}</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="flex flex-col gap-2">
							<select
								value={formData.release}
								onChange={e =>
									setFormData(prev => ({ ...prev, release: e.target.value }))
								}
								className="w-full mb-2 border rounded px-3 py-2 text-sm"
							>
								<option key="release-empty" value="">
									Seleccionar lanzamiento
								</option>
								{releases.map(release => (
									<option key={`release-${release._id}`} value={release._id}>
										{release.name}
									</option>
								))}
							</select>

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
										{releases.find(r => r._id === formData.release)?.name}
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
									className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
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
									value={formData.genre.id}
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
								<select
									name="subgenre"
									value={formData.subgenre.id}
									onChange={handleChange}
									className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
								>
									<option key="subgenre-empty" value="">
										Seleccionar subgénero
									</option>
									{genres
										.find(g => g.id === formData.genre.id)
										?.subgenres?.map(subgenre => (
											<option
												key={`subgenre-${subgenre.id}`}
												value={subgenre.id}
											>
												{subgenre.name}
											</option>
										))}
								</select>
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
									Duración
								</label>
								<input
									type="text"
									name="track_lenght"
									value={formData.track_lenght}
									onChange={handleChange}
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
									Label Share
								</label>
								<input
									type="text"
									name="label_share"
									value={formData.label_share}
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

							{/* File Upload Section */}
							<div className="space-y-4">
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
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Sample Start
								</label>
								<input
									type="text"
									name="sample_start"
									value={formData.sample_start}
									onChange={handleChange}
									className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
								/>
							</div>
						</div>

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
									Album Only
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

						<div className="text-sm text-gray-500 mt-4">
							<p>Creado: {new Date(formData.createdAt).toLocaleString()}</p>
							<p>
								Actualizado: {new Date(formData.updatedAt).toLocaleString()}
							</p>
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
								{formData.artists.length === 0 ? (
									<div className="flex items-center gap-2">
										<select
											value={formData.artists[0]?.artist ?? ''}
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
											value={formData.artists[0]?.kind ?? ''}
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
												typeof formData.artists[0]?.order === 'number'
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
									formData.artists.map((artist, index) => (
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
												value={
													typeof artist.order === 'number' ? artist.order : 0
												}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													const val = parseInt(e.target.value);
													handleArtistChange(
														index,
														'order',
														isNaN(val) ? 0 : val
													);
												}}
												className="w-20 p-2 border rounded"
												placeholder="Order"
											/>

											{formData.artists.length > 1 && (
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
								<h3 className="text-lg font-medium text-gray-900">
									Contribuidores
								</h3>
								<button
									type="button"
									onClick={handleAddContributor}
									className="p-2 text-brand-light hover:text-brand-dark rounded-full"
								>
									<Plus size={20} />
								</button>
							</div>
							<div className="space-y-4">
								{formData.contributors.length === 0 ? (
									<div className="flex items-center gap-2">
										<select
											value={formData.contributors[0]?.name || ''}
											onChange={e => {
												const selectValue = e.target.value;
												console.log(`Select contributor value:`, selectValue);
												if (selectValue && selectValue !== '') {
													handleContributorChange(0, 'name', selectValue);
												}
											}}
											className="flex-1 p-2 border rounded"
										>
											<option value="">Select Contributor</option>
											{contributors?.map((c, idx) => (
												<option
													key={`contributor-${idx}-${c?.name || 'empty'}`}
													value={c?.name || ''}
												>
													{c?.name || ''}
												</option>
											))}
										</select>

										<select
											value={formData.contributors[0]?.role || ''}
											onChange={e => {
												const value = e.target.value;
												console.log('Role select value:', value);
												if (value && value !== '') {
													handleContributorChange(0, 'role', value);
												}
											}}
											className="flex-1 p-2 border rounded"
										>
											<option value="">Select Role</option>
											{roles?.map((r, idx) => (
												<option
													key={`role-${idx}-${r?.id || 'empty'}`}
													value={r?.id ? String(r.id) : ''}
												>
													{r?.name || ''}
												</option>
											))}
										</select>

										<input
											type="number"
											value={formData.contributors[0]?.order ?? 0}
											onChange={e => {
												const val = parseInt(e.target.value);
												console.log('Order value:', val);
												if (!isNaN(val)) {
													handleContributorChange(0, 'order', val);
												}
											}}
											className="w-20 p-2 border rounded"
											placeholder="Order"
										/>
									</div>
								) : (
									formData.contributors.map((contributor, index) => (
										<div
											key={`contributor-row-${index}`}
											className="flex items-center gap-2"
										>
											<select
												value={contributor.name || ''}
												onChange={e => {
													const selectValue = e.target.value;
													console.log(`Select contributor value:`, selectValue);
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
													console.log('Role select value:', value);
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
													console.log('Order value:', val);
													if (!isNaN(val)) {
														handleContributorChange(index, 'order', val);
													}
												}}
												className="w-20 p-2 border rounded"
												placeholder="Order"
											/>

											{formData.contributors.length > 1 && (
												<button
													onClick={() => handleRemoveContributor(index)}
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

						{/* Publishers Section */}
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<h3 className="text-lg font-medium text-gray-900">
									Publishers
								</h3>
								<button
									type="button"
									onClick={handleAddPublisher}
									className="p-2 text-brand-light hover:text-brand-dark rounded-full"
								>
									<Plus size={20} />
								</button>
							</div>
							<div className="space-y-4">
								{formData.publishers.length === 0 ? (
									<div className="flex items-center gap-2">
										<select
											value={String(formData.publishers[0]?.publisher || '')}
											onChange={e =>
												handlePublisherChange(
													0,
													'publisher',
													e.target.value ? parseInt(e.target.value) : 0
												)
											}
											className="flex-1 p-2 border rounded"
										>
											<option value="">Select Publisher</option>
											{publishers?.map(p => (
												<option
													key={`publisher-${p?.id ?? 'undefined'}`}
													value={String(p?.id || '')}
												>
													{p?.name}
												</option>
											))}
										</select>
									</div>
								) : (
									formData.publishers.map((publisher, index) => (
										<div key={index} className="flex items-center gap-2">
											<select
												value={String(publisher.publisher || '')}
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
												<option value="">Select Publisher</option>
												{publishers?.map(p => (
													<option
														key={`publisher-${p?.id ?? 'undefined'}`}
														value={String(p?.id || '')}
													>
														{p?.name}
													</option>
												))}
											</select>

											<input
												type="text"
												name="author"
												value={publisher.author}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													handlePublisherChange(
														index,
														'author',
														e.target.value
													);
												}}
												className="flex-1 p-2 border rounded"
											/>

											<input
												type="number"
												value={publisher.order ?? 0}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													const val = parseInt(e.target.value);
													handlePublisherChange(
														index,
														'order',
														isNaN(val) ? 0 : val
													);
												}}
												className="w-20 p-2 border rounded"
												placeholder="Order"
											/>

											{formData.publishers.length > 1 && (
												<button
													onClick={() => handleRemovePublisher(index)}
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
