import React, { useState, useEffect } from 'react';
import { X, Save, XCircle, Plus, Trash2 } from 'lucide-react';

interface Artist {
	id: number;
	name: string;
	artist: number;
	kind: string;
	order: number;
}

interface Contributor {
	id: number;
	name: string;
	contributor: number;
	role: number;
	order: number;
}

interface Publisher {
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

interface Track {
	_id: string;
	name: string;
	mix_name: string;
	DA_ISRC: string;
	ISRC: string;
	__v: number;
	album_only: boolean;
	artists: { artist: number; kind: string; order: number }[];
	contributors: { contributor: number; role: number; order: number }[];
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
	order: number;
	publishers: { publisher: number; author: string; order: number }[];
	release: string;
	resource: string;
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
}) => {
	const [formData, setFormData] = useState<Track>({
		...track,
		release: track.release || '',
		language: track.language || '',
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
			artist: artist.artist || 0,
			kind: artist.kind || '',
			order: artist.order || 0,
		})),
		contributors: track.contributors.map(contributor => ({
			...contributor,
			contributor: contributor.contributor || 0,
			role: contributor.role || 0,
			order: contributor.order || 0,
		})),
		publishers: track.publishers.map(publisher => ({
			...publisher,
			publisher: publisher.publisher || 0,
			author: publisher.author || '',
			order: publisher.order || 0,
		})),
	});
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

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Fetch releases
				const releasesRes = await fetch('/api/admin/getAllReleases');
				const releasesData = await releasesRes.json();
				if (releasesData.success) {
					console.log('Releases:', releasesData);
					setReleases(releasesData.data);
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
						console.log('Genres:', genresData.data);
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
						console.error(
							'Formato de respuesta de géneros inesperado:',
							genresData
						);
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
				{
					artist: 0,
					kind: '',
					order: prev.artists.length + 1,
				},
			],
		}));
	};

	const handleAddContributor = () => {
		const newContributor = {
			contributor: 0,
			role: 0,
			order: formData.contributors.length,
		};
		setFormData(prev => ({
			...prev,
			contributors: [...prev.contributors, newContributor],
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
		setFormData(prev => ({
			...prev,
			artists: prev.artists.map((artist, i) =>
				i === index ? { ...artist, [field]: value } : artist
			),
		}));
	};

	const handleContributorChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => ({
			...prev,
			contributors: prev.contributors.map((contributor, i) =>
				i === index ? { ...contributor, [field]: value } : contributor
			),
		}));
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			await onSave(formData);
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
								<option value="">Seleccionar lanzamiento</option>
								{releases.map(release => (
									<option key={release._id} value={release._id}>
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
									<option value="">Seleccionar género</option>
									{genres.map(genre => (
										<option key={genre.id} value={genre.id}>
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
									<option value="">Seleccionar subgénero</option>
									{genres
										.find(g => g.id === formData.genre.id)
										?.subgenres?.map(subgenre => (
											<option key={subgenre.id} value={subgenre.id}>
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
									<option value="ES">Español</option>
									<option value="EN">English</option>
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

							<div>
								<label className="block text-sm font-medium text-gray-700">
									Resource
								</label>
								<input
									type="text"
									name="resource"
									value={formData.resource}
									onChange={handleChange}
									className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
								/>
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
								{formData.artists.map((artist, index) => (
									<div key={index} className="flex items-center gap-2">
										<select
											value={artist.artist}
											onChange={e =>
												handleArtistChange(
													index,
													'artist',
													parseInt(e.target.value)
												)
											}
											className="flex-1 p-2 border rounded"
										>
											<option value="">Select Artist</option>
											{artists.map(a => (
												<option key={a.id} value={a.id}>
													{a.name}
												</option>
											))}
										</select>
										<select
											value={artist.kind}
											onChange={e =>
												handleArtistChange(index, 'kind', e.target.value)
											}
											className="flex-1 p-2 border rounded"
										>
											<option value="">Select Kind</option>
											<option value="main">Main</option>
											<option value="featuring">Featuring</option>
											<option value="remixer">Remixer</option>
										</select>
										<input
											type="number"
											value={artist.order}
											onChange={e =>
												handleArtistChange(
													index,
													'order',
													parseInt(e.target.value)
												)
											}
											className="w-20 p-2 border rounded"
											placeholder="Order"
										/>
										<button
											onClick={() => handleRemoveArtist(index)}
											className="p-2 text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									</div>
								))}
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
								{formData.contributors.map((contributor, index) => (
									<div key={index} className="flex items-center gap-2">
										<select
											value={contributor.contributor}
											onChange={e =>
												handleContributorChange(
													index,
													'contributor',
													parseInt(e.target.value)
												)
											}
											className="flex-1 p-2 border rounded"
										>
											<option value="">Select Contributor</option>
											{contributors.map(c => (
												<option key={c.id} value={c.id}>
													{c.name}
												</option>
											))}
										</select>
										<select
											value={contributor.role}
											onChange={e =>
												handleContributorChange(
													index,
													'role',
													parseInt(e.target.value)
												)
											}
											className="flex-1 p-2 border rounded"
										>
											<option value="">Select Role</option>
											{roles.map(r => (
												<option key={r.id} value={r.id}>
													{r.name}
												</option>
											))}
										</select>
										<input
											type="number"
											value={contributor.order}
											onChange={e =>
												handleContributorChange(
													index,
													'order',
													parseInt(e.target.value)
												)
											}
											className="w-20 p-2 border rounded"
											placeholder="Order"
										/>
										<button
											onClick={() => handleRemoveContributor(index)}
											className="p-2 text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									</div>
								))}
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
								{formData.publishers.map((publisher, index) => (
									<div key={index} className="flex items-center gap-4">
										<input
											type="text"
											value={publisher.author}
											onChange={e =>
												handlePublisherChange(index, 'author', e.target.value)
											}
											className="flex-1 border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
											placeholder="Publisher"
										/>
										<button
											type="button"
											onClick={() => handleRemovePublisher(index)}
											className="p-2 text-red-500 hover:text-red-700 rounded-full"
										>
											<Trash2 size={20} />
										</button>
									</div>
								))}
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
