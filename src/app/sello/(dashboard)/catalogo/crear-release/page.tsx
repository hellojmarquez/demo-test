'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Upload, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Genre {
	id: number;
	name: string;
	subgenres: Subgenre[];
}

interface Subgenre {
	id: number;
	name: string;
}

interface Release {
	name: string;
	label: number;
	label_name: string;
	kind: string;
	language: string;
	countries: string[];
	artists: any[];
	tracks: any[];
	picture: {
		base64: string;
	} | null;
	dolby_atmos: boolean;
	backcatalog: boolean;
	auto_detect_language: boolean;
	generate_ean: boolean;
	youtube_declaration: boolean;
	createdAt: string;
	updatedAt: string;
	release_version: string;
	publisher: string;
	publisher_year: string;
	copyright_holder: string;
	copyright_holder_year: string;
	genre: {
		id: number;
		name: string;
	};
	subgenre: {
		id: number;
		name: string;
	};
	catalogue_number: string;
	is_new_release: number;
	official_date: string;
	original_date: string;
	territory: string;
}

interface Artist {
	order: number;
	artist: number;
	kind: string;
	name: string;
}

interface ArtistData {
	external_id: number;
	name: string;
	role: string;
}

interface SelloData {
	external_id: number;
	name: string;
}

const CreateReleasePage = () => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [artistData, setArtistData] = useState<ArtistData[]>([]);
	const [selloData, setSelloData] = useState<SelloData[]>([]);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [genres, setGenres] = useState<Genre[]>([]);
	const [formData, setFormData] = useState<Partial<Release>>({
		name: '',
		label: 0,
		label_name: '',
		kind: 'single',
		language: 'ES',
		countries: [],
		artists: [],
		tracks: [],
		picture: null,
		dolby_atmos: false,
		backcatalog: false,
		auto_detect_language: false,
		generate_ean: true,
		youtube_declaration: false,
		release_version: '',
		publisher: '',
		publisher_year: '',
		copyright_holder: '',
		copyright_holder_year: '',
		genre: {
			id: 0,
			name: '',
		},
		subgenre: {
			id: 0,
			name: '',
		},
		catalogue_number: '',
		is_new_release: 0,
		official_date: new Date().toISOString().split('T')[0],
		original_date: new Date().toISOString().split('T')[0],
		territory: 'worldwide',
	});
	const [artists, setArtists] = useState<Artist[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Fetch genres
				const genresRes = await fetch('/api/admin/getAllGenres');
				const genresData = await genresRes.json();
				const artistsRes = await fetch('/api/admin/getAllArtists');
				const artistsData = await artistsRes.json();
				const selloRes = await fetch('/api/admin/getAllSellos');
				const selloData = await selloRes.json();
				// const publisherRes = await fetch('/api/admin/getAllPublishers');
				// const publisherData = await publisherRes.json();

				// if (publisherData.success && Array.isArray(publisherData.data)) {
				// 	setSelloData(publisherData.data);
				// 	console.log(publisherData.data);
				// }
				if (selloData.success && Array.isArray(selloData.data)) {
					setSelloData(selloData.data);
				}
				if (artistsData.success && Array.isArray(artistsData.data)) {
					setArtistData(artistsData.data);
				}
				if (genresData.success && Array.isArray(genresData.data)) {
					setGenres(genresData.data);
					console.log(genresData.data);
				} else {
					setError(
						'Error al cargar los géneros. Formato de respuesta inesperado.'
					);
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
			const currentGenre = genres.find(g => g.id === formData.genre?.id);
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

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type.startsWith('image/')) {
				const reader = new FileReader();
				reader.onload = () => {
					setFormData(prev => ({
						...prev,
						picture: {
							base64: reader.result as string,
						},
					}));
				};
				reader.readAsDataURL(file);
				setSelectedFile(file);
			} else {
				alert('Por favor, selecciona un archivo de imagen válido');
				e.target.value = '';
			}
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const formDataToSend = new FormData();

			// Agregar todos los campos del formulario
			Object.entries(formData).forEach(([key, value]) => {
				if (
					key === 'picture' &&
					typeof value === 'object' &&
					value !== null &&
					'base64' in value
				) {
					// Convertir base64 a Blob para la imagen
					const base64Data = (value as { base64: string }).base64.split(',')[1];
					const byteCharacters = atob(base64Data);
					const byteArrays = [];
					for (let i = 0; i < byteCharacters.length; i++) {
						byteArrays.push(byteCharacters.charCodeAt(i));
					}
					const byteArray = new Uint8Array(byteArrays);
					const blob = new Blob([byteArray], { type: 'image/jpeg' });
					formDataToSend.append('picture', blob, 'cover.jpg');
				} else if (
					key === 'artists' ||
					key === 'countries' ||
					key === 'genre' ||
					key === 'subgenre'
				) {
					// Convertir arrays y objetos a JSON string
					formDataToSend.append(key, JSON.stringify(value));
				} else if (key === 'label' && value !== null) {
					// Asegurar que label se envíe como número
					formDataToSend.append(key, value.toString());
				} else if (value !== null && value !== undefined) {
					formDataToSend.append(key, value.toString());
				}
			});
			console.log('data to send: ', formDataToSend);
			const response = await fetch('/api/admin/createRelease', {
				method: 'POST',
				body: formDataToSend,
			});

			if (response.ok) {
				router.push('/sello/catalogo');
			} else {
				const data = await response.json();
				throw new Error(data.message || 'Error al crear el lanzamiento');
			}
		} catch (error) {
			console.error('Error creating release:', error);
			setError(
				error instanceof Error ? error.message : 'Error al crear el lanzamiento'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddArtist = () => {
		setArtists(prev => {
			const newArtists = [
				...prev,
				{ order: prev.length, artist: 0, kind: '', name: '' },
			];

			// Actualizar formData.artists con los nuevos datos
			setFormData(prev => ({
				...prev,
				artists: newArtists.map(artist => ({
					order: artist.order,
					artist: artist.artist,
					kind: artist.kind,
					name: artist.name,
				})),
			}));

			return newArtists;
		});
	};

	const handleArtistChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setArtists(prev => {
			const newArtists = [...prev];
			if (!newArtists[index]) {
				newArtists[index] = { order: 0, artist: 0, kind: '', name: '' };
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

			// Actualizar formData.artists con los nuevos datos
			setFormData(prev => ({
				...prev,
				artists: newArtists.map(artist => ({
					order: artist.order,
					artist: artist.artist,
					kind: artist.kind,
					name: artist.name,
				})),
			}));

			return newArtists;
		});
	};

	return (
		<div className="min-h-screen w-full">
			<div className="mx-auto px-4 shadow-lg">
				<div className="bg-white rounded-lg shadow-sm p-6">
					<div className="flex justify-between items-center mb-6">
						<h1 className="text-2xl font-bold text-gray-900">
							Crear Nuevo Lanzamiento
						</h1>
						<button
							onClick={() => router.back()}
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
							<p>{error}</p>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
										Label
									</label>
									<select
										name="label"
										value={formData.label}
										onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
											const selectedSello = selloData.find(
												s => s.external_id === parseInt(e.target.value)
											);
											setFormData(prev => ({
												...prev,
												label: parseInt(e.target.value),
												label_name: selectedSello?.name || '',
											}));
										}}
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
									>
										<option value="">Seleccionar Label</option>
										{selloData?.map(sello => (
											<option
												key={`sello-${sello.external_id}`}
												value={sello.external_id}
											>
												{sello.name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										Tipo
									</label>
									<select
										name="kind"
										value={formData.kind}
										onChange={handleChange}
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
									>
										<option value="single">Single</option>
										<option value="album">Álbum</option>
										<option value="ep">EP</option>
									</select>
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
										Versión del Release
									</label>
									<input
										type="text"
										name="release_version"
										value={formData.release_version}
										onChange={handleChange}
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										Publisher
									</label>
									<input
										type="text"
										name="publisher"
										value={formData.publisher}
										onChange={handleChange}
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										Año del Publisher
									</label>
									<input
										type="text"
										name="publisher_year"
										value={formData.publisher_year}
										onChange={handleChange}
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										Titular del Copyright
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
										Año del Copyright
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
										Género
									</label>
									<select
										name="genre"
										value={formData.genre?.id || ''}
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
									{formData.genre?.name && (
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
										value={formData.subgenre?.id || ''}
										onChange={handleChange}
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
									>
										<option key="subgenre-empty" value="">
											Seleccionar subgénero
										</option>
										{genres
											.find(g => g.id === formData.genre?.id)
											?.subgenres?.map(subgenre => (
												<option
													key={`subgenre-${subgenre.id}`}
													value={subgenre.id}
												>
													{subgenre.name}
												</option>
											))}
									</select>
									{formData.subgenre?.name && (
										<p className="text-xs text-gray-500 mt-1">
											Subgénero actual: {formData.subgenre.name}
										</p>
									)}
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
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										Es Nuevo Release
									</label>
									<select
										name="is_new_release"
										value={formData.is_new_release}
										onChange={handleChange}
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
									>
										<option value={1}>Sí</option>
										<option value={0}>No</option>
									</select>
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
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
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
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										Territorio
									</label>
									<select
										name="territory"
										value={formData.territory}
										onChange={handleChange}
										className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
									>
										<option value="worldwide">Worldwide</option>
										<option value="specific">Específico</option>
									</select>
								</div>

								{formData.territory === 'specific' && (
									<div className="col-span-2">
										<label className="block text-sm font-medium text-gray-700">
											Países
										</label>
										<input
											type="text"
											name="countries"
											value={formData.countries?.join(', ')}
											onChange={e => {
												const countries = e.target.value
													.split(',')
													.map(country => country.trim());
												setFormData(prev => ({
													...prev,
													countries,
												}));
											}}
											className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
											placeholder="Ingresa los países separados por comas"
										/>
									</div>
								)}
							</div>

							<div className="space-y-4">
								<div className="flex items-center gap-4">
									<label className="block text-sm font-medium text-gray-700">
										Portada
									</label>
									<div>
										<input
											type="file"
											ref={fileInputRef}
											onChange={handleFileChange}
											accept="image/*"
											className="hidden"
										/>
										<button
											type="button"
											onClick={() => fileInputRef.current?.click()}
											className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
										>
											<Upload className="h-4 w-4 mr-2" />
											Subir imagen
										</button>
									</div>
								</div>
								{formData.picture?.base64 && (
									<div className="mt-2">
										<img
											src={formData.picture.base64}
											alt="Preview"
											className="h-32 w-32 object-cover rounded-lg"
										/>
									</div>
								)}
							</div>

							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
										name="auto_detect_language"
										checked={formData.auto_detect_language}
										onChange={handleChange}
										className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
									/>
									<label className="ml-2 block text-sm text-gray-700">
										Auto detectar idioma
									</label>
								</div>

								<div className="flex items-center">
									<label className="ml-2 block text-sm text-gray-700">
										UPC generado automáticamente
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
										Declaración YouTube
									</label>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<h3 className="text-lg font-medium text-gray-900">
										Artistas
									</h3>
									<button
										type="button"
										onClick={handleAddArtist}
										className="p-2 text-brand-light hover:text-brand-dark rounded-full"
									>
										<Plus size={20} />
									</button>
								</div>
								<div className="space-y-4">
									{artists.length === 0 ? (
										<div className="flex items-center gap-2">
											<select
												value={artists[0]?.artist ?? ''}
												onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
													const value = e.target.value;
													if (value) {
														handleArtistChange(0, 'artist', value);
													}
												}}
												className="flex-1 p-2 border rounded"
											>
												<option value="">Seleccionar Artista</option>
												{artistData?.map(a => (
													<option
														key={`artist-${a?.external_id || ''}`}
														value={a?.external_id || ''}
													>
														{a?.name || ''}
													</option>
												))}
											</select>

											<select
												value={artists[0]?.kind ?? ''}
												onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
													handleArtistChange(0, 'kind', e.target.value);
												}}
												className="flex-1 p-2 border rounded"
											>
												<option value="">Seleccionar Tipo</option>
												<option value="main">Principal</option>
												<option value="featuring">Invitado</option>
												<option value="remixer">Remixer</option>
											</select>

											<input
												type="number"
												value={artists[0]?.order ?? 0}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													const val = parseInt(e.target.value);
													handleArtistChange(0, 'order', isNaN(val) ? 0 : val);
												}}
												className="w-20 p-2 border rounded"
												placeholder="Orden"
											/>
										</div>
									) : (
										artists.map((artist, index) => (
											<div key={index} className="flex items-center gap-2">
												<select
													value={artist.artist ?? ''}
													onChange={(
														e: React.ChangeEvent<HTMLSelectElement>
													) => {
														const value = e.target.value;
														if (value) {
															handleArtistChange(index, 'artist', value);
														}
													}}
													className="flex-1 p-2 border rounded"
												>
													<option value="">Seleccionar Artista</option>
													{artistData?.map(a => (
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
													onChange={(
														e: React.ChangeEvent<HTMLSelectElement>
													) => {
														handleArtistChange(index, 'kind', e.target.value);
													}}
													className="flex-1 p-2 border rounded"
												>
													<option value="">Seleccionar Tipo</option>
													<option value="main">Principal</option>
													<option value="featuring">Invitado</option>
													<option value="remixer">Remixer</option>
												</select>

												<input
													type="number"
													value={artist.order ?? 0}
													onChange={(
														e: React.ChangeEvent<HTMLInputElement>
													) => {
														const val = parseInt(e.target.value);
														handleArtistChange(
															index,
															'order',
															isNaN(val) ? 0 : val
														);
													}}
													className="w-20 p-2 border rounded"
													placeholder="Orden"
												/>
											</div>
										))
									)}
								</div>
							</div>

							<div className="flex justify-end space-x-3 mt-6">
								<button
									type="button"
									onClick={() => router.back()}
									disabled={isLoading}
									className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<X className="h-4 w-4 group-hover:text-brand-dark" />
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
											<span>Creando...</span>
										</>
									) : (
										<>
											<Save className="h-4 w-4 group-hover:text-brand-dark" />
											<span className="group-hover:text-brand-dark">Crear</span>
										</>
									)}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
};

export default CreateReleasePage;
