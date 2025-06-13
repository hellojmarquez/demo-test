'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Upload, Plus } from 'lucide-react';
import Select, { SingleValue } from 'react-select';

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

	// Add the common input styles
	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';
	const selectStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent appearance-none cursor-pointer relative pr-8';

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

				if (selloData.success && Array.isArray(selloData.data)) {
					setSelloData(selloData.data);
				}
				if (artistsData.success && Array.isArray(artistsData.data)) {
					setArtistData(artistsData.data);
				}
				if (genresData.success && Array.isArray(genresData.data)) {
					setGenres(genresData.data);
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

			const response = await fetch('/api/admin/createRelease', {
				method: 'POST',
				body: formDataToSend,
			});

			if (response.ok) {
				router.push('/panel/catalogo');
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

	const currentYear = new Date().getFullYear();
	const years = Array.from(
		{ length: currentYear - 1899 },
		(_, i) => currentYear - i
	).map(year => ({
		value: year.toString(),
		label: year.toString(),
	}));

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
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Nombre
									</label>
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleChange}
										className={inputStyles}
										required
									/>
								</div>
								<div className="flex items-center gap-4">
									<div>
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
									<div className="space-y-4">
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
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Sello
									</label>
									<Select
										value={
											formData.label
												? {
														value: formData.label,
														label:
															selloData.find(
																s => s.external_id === formData.label
															)?.name || '',
												  }
												: null
										}
										onChange={(
											selectedOption: SingleValue<{
												value: number;
												label: string;
											}>
										) => {
											if (selectedOption) {
												handleChange({
													target: {
														name: 'label',
														value: selectedOption.value,
													},
												} as any);
											}
										}}
										options={selloData.map(sello => ({
											value: sello.external_id,
											label: sello.name,
										}))}
										placeholder="Seleccionar sello"
										className="react-select-container"
										classNamePrefix="react-select"
										styles={reactSelectStyles}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Tipo
									</label>
									<Select
										value={{
											value: formData.kind,
											label:
												formData.kind === 'single'
													? 'Single'
													: formData.kind === 'ep'
													? 'EP'
													: 'Album',
										}}
										onChange={(
											selectedOption: SingleValue<{
												value: string | undefined;
												label: string;
											}>
										) => {
											if (selectedOption) {
												handleChange({
													target: {
														name: 'kind',
														value: selectedOption.value || '',
													},
												} as any);
											}
										}}
										options={[
											{ value: 'single', label: 'Single' },
											{ value: 'ep', label: 'EP' },
											{ value: 'album', label: 'Album' },
										]}
										className="react-select-container"
										classNamePrefix="react-select"
										styles={reactSelectStyles}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Idioma
									</label>
									<Select
										value={{
											value: formData.language,
											label: formData.language === 'ES' ? 'Español' : 'English',
										}}
										onChange={(
											selectedOption: SingleValue<{
												value: string | undefined;
												label: string;
											}>
										) => {
											if (selectedOption) {
												handleChange({
													target: {
														name: 'language',
														value: selectedOption.value || '',
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
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Versión del Lanzamiento
									</label>
									<input
										type="text"
										name="release_version"
										value={formData.release_version}
										onChange={handleChange}
										className={inputStyles}
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Editor
									</label>
									<input
										type="text"
										name="publisher"
										value={formData.publisher}
										onChange={handleChange}
										className={inputStyles}
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Año del Editor
									</label>
									<Select
										value={{
											value: formData.publisher_year,
											label: formData.publisher_year,
										}}
										onChange={(
											selectedOption: SingleValue<{
												value: string | undefined;
												label: string | undefined;
											}>
										) => {
											if (selectedOption) {
												handleChange({
													target: {
														name: 'publisher_year',
														value: selectedOption.value || '',
													},
												} as any);
											}
										}}
										options={years}
										className="react-select-container"
										classNamePrefix="react-select"
										styles={reactSelectStyles}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Titular de los Derechos
									</label>
									<input
										type="text"
										name="copyright_holder"
										value={formData.copyright_holder}
										onChange={handleChange}
										className={inputStyles}
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Año del Titular de los Derechos
									</label>
									<Select
										value={{
											value: formData.copyright_holder_year,
											label: formData.copyright_holder_year,
										}}
										onChange={(
											selectedOption: SingleValue<{
												value: string | undefined;
												label: string | undefined;
											}>
										) => {
											if (selectedOption) {
												handleChange({
													target: {
														name: 'copyright_holder_year',
														value: selectedOption.value || '',
													},
												} as any);
											}
										}}
										options={years}
										className="react-select-container"
										classNamePrefix="react-select"
										styles={reactSelectStyles}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Género
									</label>
									<Select
										value={
											formData.genre?.id
												? {
														value: formData.genre.id.toString(),
														label: formData.genre.name,
												  }
												: null
										}
										onChange={(
											selectedOption: SingleValue<{
												value: string;
												label: string;
											}>
										) => {
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
											value: genre.id.toString(),
											label: genre.name,
										}))}
										placeholder="Seleccionar género"
										className="react-select-container"
										classNamePrefix="react-select"
										styles={reactSelectStyles}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Subgénero
									</label>
									<Select
										value={
											formData.subgenre?.id
												? {
														value: formData.subgenre.id.toString(),
														label: formData.subgenre.name,
												  }
												: null
										}
										onChange={(
											selectedOption: SingleValue<{
												value: string;
												label: string;
											}>
										) => {
											if (selectedOption) {
												handleChange({
													target: {
														name: 'subgenre',
														value: selectedOption.value,
													},
												} as any);
											}
										}}
										options={
											genres
												.find(g => g.id === formData.genre?.id)
												?.subgenres.map(subgenre => ({
													value: subgenre.id.toString(),
													label: subgenre.name,
												})) || []
										}
										placeholder="Seleccionar subgénero"
										className="react-select-container"
										classNamePrefix="react-select"
										styles={reactSelectStyles}
										isDisabled={!formData.genre?.id}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Número de Catálogo
									</label>
									<input
										type="text"
										name="catalogue_number"
										value={formData.catalogue_number}
										onChange={handleChange}
										className={inputStyles}
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Es Nuevo Release
									</label>
									<Select
										value={{
											value: formData.is_new_release?.toString() || '0',
											label: formData.is_new_release === 1 ? 'Sí' : 'No',
										}}
										onChange={(
											selectedOption: SingleValue<{
												value: string | undefined;
												label: string;
											}>
										) => {
											if (selectedOption) {
												handleChange({
													target: {
														name: 'is_new_release',
														value: selectedOption.value,
													},
												} as any);
											}
										}}
										options={[
											{ value: '1', label: 'Sí' },
											{ value: '0', label: 'No' },
										]}
										className="react-select-container"
										classNamePrefix="react-select"
										styles={reactSelectStyles}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Fecha Oficial
									</label>
									<input
										type="date"
										name="official_date"
										value={formData.official_date}
										onChange={handleChange}
										className={inputStyles}
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Fecha Original
									</label>
									<input
										type="date"
										name="original_date"
										value={formData.original_date}
										onChange={handleChange}
										className={inputStyles}
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										Territorio
									</label>
									<Select
										value={{
											value: formData.territory,
											label:
												formData.territory === 'worldwide'
													? 'Worldwide'
													: 'Específico',
										}}
										onChange={(
											selectedOption: SingleValue<{
												value: string | undefined;
												label: string;
											}>
										) => {
											if (selectedOption) {
												handleChange({
													target: {
														name: 'territory',
														value: selectedOption.value || '',
													},
												} as any);
											}
										}}
										options={[
											{ value: 'worldwide', label: 'Worldwide' },
											{ value: 'specific', label: 'Específico' },
										]}
										className="react-select-container"
										classNamePrefix="react-select"
										styles={reactSelectStyles}
									/>
								</div>
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
										<div className="flex items-center gap-2 w-full">
											<Select
												value={
													artists[0]?.artist
														? {
																value: artists[0].artist,
																label: artists[0].name,
														  }
														: null
												}
												onChange={(
													selectedOption: SingleValue<{
														value: number;
														label: string;
													}>
												) => {
													if (selectedOption) {
														handleArtistChange(
															0,
															'artist',
															selectedOption.value
														);
													}
												}}
												options={artistData.map(artist => ({
													value: artist.external_id,
													label: artist.name,
												}))}
												placeholder="Seleccionar Artista"
												className="react-select-container flex-1"
												classNamePrefix="react-select"
												styles={reactSelectStyles}
											/>

											<Select
												value={
													artists[0]?.kind
														? {
																value: artists[0].kind,
																label:
																	artists[0].kind === 'main'
																		? 'Principal'
																		: artists[0].kind === 'featuring'
																		? 'Invitado'
																		: 'Remixer',
														  }
														: null
												}
												onChange={(
													selectedOption: SingleValue<{
														value: string;
														label: string;
													}>
												) => {
													if (selectedOption) {
														handleArtistChange(0, 'kind', selectedOption.value);
													}
												}}
												options={[
													{ value: 'main', label: 'Principal' },
													{ value: 'featuring', label: 'Invitado' },
													{ value: 'remixer', label: 'Remixer' },
												]}
												placeholder="Seleccionar Tipo"
												className="react-select-container flex-1"
												classNamePrefix="react-select"
												styles={reactSelectStyles}
											/>

											<input
												type="number"
												value={artists[0]?.order ?? 0}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													const val = parseInt(e.target.value);
													handleArtistChange(0, 'order', isNaN(val) ? 0 : val);
												}}
												className="w-20 px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
												placeholder="Orden"
											/>
										</div>
									) : (
										artists.map((artist, index) => (
											<div
												key={index}
												className="flex items-center gap-2 w-full"
											>
												<Select
													value={
														artist.artist
															? {
																	value: artist.artist,
																	label: artist.name,
															  }
															: null
													}
													onChange={(
														selectedOption: SingleValue<{
															value: number;
															label: string;
														}>
													) => {
														if (selectedOption) {
															handleArtistChange(
																index,
																'artist',
																selectedOption.value
															);
														}
													}}
													options={artistData.map(artist => ({
														value: artist.external_id,
														label: artist.name,
													}))}
													placeholder="Seleccionar Artista"
													className="react-select-container flex-1"
													classNamePrefix="react-select"
													styles={reactSelectStyles}
												/>

												<Select
													value={
														artist.kind
															? {
																	value: artist.kind,
																	label:
																		artist.kind === 'main'
																			? 'Principal'
																			: artist.kind === 'featuring'
																			? 'Invitado'
																			: 'Remixer',
															  }
															: null
													}
													onChange={(
														selectedOption: SingleValue<{
															value: string;
															label: string;
														}>
													) => {
														if (selectedOption) {
															handleArtistChange(
																index,
																'kind',
																selectedOption.value
															);
														}
													}}
													options={[
														{ value: 'main', label: 'Principal' },
														{ value: 'featuring', label: 'Invitado' },
														{ value: 'remixer', label: 'Remixer' },
													]}
													placeholder="Seleccionar Tipo"
													className="react-select-container flex-1"
													classNamePrefix="react-select"
													styles={reactSelectStyles}
												/>

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
													className="w-20 px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
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
