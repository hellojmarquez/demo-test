import React, { useState } from 'react';
import InputGroup from './InputGroup';
// Tipos para los objetos anidados
interface Artist {
	order: number;
	artist: number;
	kind: string;
	avatar: File | null;
	avatarPreview: string;
	label: number;
}

type FormProductsProps = {
	tipoProducto: string;
};

const FormRelease = ({ tipoProducto }: FormProductsProps) => {
	const [formData, setFormData] = useState({
		name: '',
		release_version: '',
		language: '',
		catalogue_number: '',
		auto_detect_language: true,
		label: 0,
		artists: [],
		avatar: null as File | null,
		avatarPreview: '',
		publisher: '',
		publisher_year: '',
		copyright_holder: '',
		copyright_holder_year: '',
		genre: 0,
		subgenre: 0,
		kind: '',
		artwork: '',
		is_new_release: 0,
		official_date: '',
		original_date: '',
		exclusive_shop: 0,
		territory: '',
		countries: [''],
		backcatalog: true,
		ean: '',
		generate_ean: true,
		tracks: [],
		youtube_declaration: true,
		dolby_atmos: true,
	});
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Verificamos que sea una imagen
			if (!file.type.startsWith('image/')) {
				alert('Por favor, selecciona un archivo de imagen válido.');
				return;
			}

			// Creamos una URL para la vista previa
			const previewUrl = URL.createObjectURL(file);

			setFormData(prev => ({
				...prev,
				avatar: file,
				avatarPreview: previewUrl,
			}));
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target;

		const newValue =
			type === 'checkbox' && e.target instanceof HTMLInputElement
				? e.target.checked
				: value;

		setFormData(prevData => ({
			...prevData,
			[name]: newValue,
		}));
	};

	const handleSubmit = async () => {
		try {
			const data = new FormData();

			// Avatar file
			if (formData.avatar) {
				data.append('avatar', formData.avatar);
			}

			// Booleans como string
			const booleanFields = [
				'auto_detect_language',
				'backcatalog',
				'generate_ean',
				'youtube_declaration',
				'dolby_atmos',
			] as const;

			booleanFields.forEach(field => {
				data.append(field, formData[field] ? 'true' : 'false');
			});

			data.append('artists', JSON.stringify(formData.artists));
			data.append('tracks', JSON.stringify(formData.tracks ?? []));
			data.append('countries', JSON.stringify(formData.countries ?? []));

			// Campos numéricos
			const numericFields = [
				'label',
				'genre',
				'subgenre',
				'exclusive_shop',
				'is_new_release',
			] as const;

			numericFields.forEach(field => {
				data.append(
					field,
					formData[field] != null ? String(formData[field]) : ''
				);
			});

			// Campos de texto
			const textFields = [
				'artwork',
				'catalogue_number',
				'copyright_holder',
				'copyright_holder_year',
				'ean',
				'kind',
				'language',
				'name',
				'official_date',
				'original_date',
				'publisher',
				'publisher_year',
				'release_version',
				'territory',
			] as const;

			textFields.forEach(field => {
				data.append(field, formData[field] || '');
			});

			// Enviar petición
			const response = await fetch('/api/admin/createRelease', {
				method: 'POST',
				body: data, // sin headers, FormData se encarga
			});

			const result = await response.json();
			console.log('Respuesta del backend:', result);

			if (!response.ok) {
				throw new Error(result.error || 'Error al crear release');
			}

			alert('Release creado correctamente 🎉');
		} catch (error) {
			console.error('Error al enviar formulario:', error);
			alert('Hubo un error al crear el release.');
		}
	};

	return (
		<div className="space-y-8">
			{/* Sección: Información Básica */}
			<section>
				<h2 className="text-lg font-semibold mb-4">
					📀 Información del lanzamiento
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="label">Nombre del lanzamiento</label>
						<input
							name="name"
							value={formData.name}
							onChange={handleChange}
							className="input"
						/>
					</div>

					<div>
						<label className="label">Versión</label>
						<input
							name="release_version"
							value={formData.release_version}
							onChange={handleChange}
							className="input"
						/>
					</div>

					<div>
						<label className="label">Idioma</label>
						<input
							name="language"
							value={formData.language}
							onChange={handleChange}
							placeholder="ej: ES"
							className="input"
						/>
					</div>

					<div className="flex items-center gap-2 mt-2">
						<input
							type="checkbox"
							name="auto_detect_language"
							checked={formData.auto_detect_language}
							onChange={handleChange}
						/>
						<label className="text-sm">Detectar idioma automáticamente</label>
					</div>

					<div className="col-span-2">
						<label className="label">Portada</label>
						<input
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							className="input"
						/>
						{formData.avatar && (
							<p className="text-xs text-gray-500 mt-1">
								Imagen seleccionada: {formData.name}
							</p>
						)}
						{formData.avatarPreview && (
							<div className="mt-2">
								<p className="text-sm text-gray-600 mb-1">Vista previa:</p>
								<img
									src={formData.avatarPreview}
									alt="Vista previa del logo"
									className="max-h-40 border rounded"
								/>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Sección: Copyright */}
			<section>
				<h2 className="text-lg font-semibold mb-4">📄 Derechos de autor</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InputGroup
						label="Publisher"
						name="publisher"
						value={formData.publisher}
						onChange={e =>
							setFormData({ ...formData, publisher: e.target.value })
						}
					/>
					<InputGroup
						label="Año del Publisher"
						name="publisher_year"
						value={formData.publisher_year}
						onChange={e =>
							setFormData({ ...formData, publisher_year: e.target.value })
						}
					/>
					<InputGroup
						label="Titular del copyright"
						name="copyright_holder"
						value={formData.copyright_holder}
						onChange={e =>
							setFormData({ ...formData, copyright_holder: e.target.value })
						}
					/>
					<InputGroup
						label="Año del copyright"
						name="copyright_holder_year"
						value={formData.copyright_holder_year}
						onChange={e =>
							setFormData({
								...formData,
								copyright_holder_year: e.target.value,
							})
						}
					/>
				</div>
			</section>

			{/* Sección: Metadatos */}
			<section>
				<h2 className="text-lg font-semibold mb-4">🧩 Metadatos</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InputGroup
						label="ID del sello"
						name="label"
						value={formData.label}
						type="number"
						onChange={e =>
							setFormData({ ...formData, label: Number(e.target.value) })
						}
					/>

					<InputGroup
						label="Género"
						name="genre"
						value={formData.genre}
						type="number"
						onChange={e =>
							setFormData({ ...formData, genre: Number(e.target.value) })
						}
					/>

					<InputGroup
						label="Subgénero"
						name="subgenre"
						value={formData.subgenre}
						type="number"
						onChange={e =>
							setFormData({ ...formData, subgenre: Number(e.target.value) })
						}
					/>

					<InputGroup
						label="Tipo de lanzamiento"
						name="kind"
						value={formData.kind}
						placeholder="ej: single"
						onChange={e => setFormData({ ...formData, kind: e.target.value })}
					/>

					<InputGroup
						label="Número de catálogo"
						name="catalogue_number"
						value={formData.catalogue_number}
						onChange={e =>
							setFormData({ ...formData, catalogue_number: e.target.value })
						}
					/>

					<InputGroup
						label="EAN"
						name="ean"
						value={formData.ean}
						onChange={e => setFormData({ ...formData, ean: e.target.value })}
					/>

					<div className="flex items-center gap-2 mt-2">
						<input
							type="checkbox"
							name="generate_ean"
							checked={formData.generate_ean}
							onChange={handleChange}
						/>
						<label className="text-sm">Generar EAN automáticamente</label>
					</div>
					<div className="flex items-center gap-2 mt-2">
						<input
							type="checkbox"
							name="backcatalog"
							checked={formData.backcatalog}
							onChange={handleChange}
						/>
						<label className="text-sm">Backcatalog</label>
					</div>
					<div className="flex items-center gap-2 mt-2">
						<input
							type="checkbox"
							name="youtube_declaration"
							checked={formData.youtube_declaration}
							onChange={handleChange}
						/>
						<label className="text-sm">Declaración YouTube</label>
					</div>
					<div className="flex items-center gap-2 mt-2">
						<input
							type="checkbox"
							name="dolby_atmos"
							checked={formData.dolby_atmos}
							onChange={handleChange}
						/>
						<label className="text-sm">Dolby Atmos</label>
					</div>
				</div>
			</section>

			{/* Sección: Fechas y Distribución */}
			<section>
				<h2 className="text-lg font-semibold mb-4">📅 Fechas y distribución</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InputGroup
						label="Fecha oficial"
						name="official_date"
						value={formData.official_date}
						type="date"
						onChange={e =>
							setFormData({ ...formData, official_date: e.target.value })
						}
					/>

					<InputGroup
						label="Fecha original"
						name="original_date"
						value={formData.original_date}
						type="date"
						onChange={e =>
							setFormData({ ...formData, original_date: e.target.value })
						}
					/>

					<InputGroup
						label="Tienda exclusiva (ID)"
						name="exclusive_shop"
						value={formData.exclusive_shop}
						type="number"
						onChange={e =>
							setFormData({
								...formData,
								exclusive_shop: Number(e.target.value),
							})
						}
					/>

					<InputGroup
						label="Territorio"
						name="territory"
						value={formData.territory}
						placeholder="ej: worldwide"
						onChange={e =>
							setFormData({ ...formData, territory: e.target.value })
						}
					/>

					<div>
						<label className="label">País</label>
						<input
							name="countries[0]"
							value={formData.countries[0]}
							onChange={e =>
								setFormData(prev => ({
									...prev,
									countries: [e.target.value],
								}))
							}
							className="input"
						/>
					</div>
				</div>
			</section>

			<div className="flex justify-end mt-8">
				<button
					onClick={handleSubmit}
					className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2 rounded-md"
				>
					Crear lanzamiento
				</button>
			</div>
		</div>
	);
};

export default FormRelease;
