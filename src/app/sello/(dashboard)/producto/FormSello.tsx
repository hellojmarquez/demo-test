import React, { useEffect, useState } from 'react';
interface Subgenre {
	id: number;
	name: string;
}

interface Genre {
	id: number;
	name: string;
	subgenres: Subgenre[];
}

interface FormData {
	name: string;
	picture: File | null;
	email: string;
	password: string;
	role: string;
	picturePreview: string;
	primary_genre: Genre | null;
	year: string;
	catalog_num: string;
}
const FormSello = () => {
	const [genres, setGenres] = useState<Genre[]>([]);
	const [Msg, setMsg] = useState('');
	const [formData, setFormData] = useState<FormData>({
		name: '',
		email: '',
		password: '',
		role: '',
		picture: null,
		picturePreview: '',
		primary_genre: null,
		year: '',
		catalog_num: '',
	});

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;

		// Si el campo es year o catalog_num, aseguramos que sean numéricos
		const parsedValue = ['year', 'catalog_num'].includes(name)
			? value.replace(/\D/, '') // solo números
			: value;

		setFormData(prev => ({
			...prev,
			[name]: parsedValue,
		}));
	};
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
				picture: file,
				picturePreview: previewUrl,
			}));
		}
	};
	const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const { name, value } = e.target;

		if (name === 'primary_genre') {
			// Si es el campo de género, buscamos el objeto completo
			if (value === '') {
				// Si no hay selección, ponemos null
				setFormData(prev => ({
					...prev,
					primary_genre: null,
				}));
			} else {
				// Encontramos el género seleccionado por su ID
				const selectedGenre = genres.find(
					genre => genre.id === parseInt(value)
				);

				setFormData(prev => ({
					...prev,
					primary_genre: selectedGenre || null,
				}));
			}
		} else {
			// Para otros campos select que pudieran existir
			setFormData(prev => ({
				...prev,
				[name]: value,
			}));
		}
	};
	useEffect(() => {
		fetch('/api/admin/getAllGenres')
			.then(res => res.json())
			.then(response => {
				console.log('Respuesta completa:', response);

				// Verificamos si la respuesta tiene la estructura esperada
				if (response && response.success && Array.isArray(response.data)) {
					setGenres(response.data);
					console.log(response.data);
				} else {
					// Si no es un array, creamos un array vacío
					console.error('La respuesta no tiene el formato esperado:', response);
					setGenres([]);
				}
			})
			.catch(error => {
				console.error('Error al obtener géneros:', error);
				setGenres([]);
			});
	}, []);
	useEffect(() => {
		return () => {
			if (formData.picturePreview) {
				URL.revokeObjectURL(formData.picturePreview);
			}
		};
	}, [formData.picturePreview]);
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setMsg('');
		const submitData = new FormData();
		submitData.append('name', formData.name);
		if (formData.picture) {
			submitData.append('picture', formData.picture);
		}
		if (formData.primary_genre) {
			submitData.append(
				'primary_genre',
				JSON.stringify(formData.primary_genre)
			);
		}

		submitData.append('year', formData.year);
		submitData.append('catalog_num', formData.catalog_num);
		submitData.append('email', formData.email);
		submitData.append('password', formData.password);
		submitData.append('role', formData.role);
		console.log(submitData);

		fetch('/api/admin/createSello', {
			method: 'POST',

			body: submitData,
		})
			.then(res => res.json())
			.then(r => {
				if (r.success) {
					setMsg(r.message);
				}
			});
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="max-w-xl mx-auto space-y-6 p-6 bg-white rounded-2xl shadow-lg"
		>
			<h2 className="text-2xl font-semibold text-center">Crear nuevo sello</h2>

			{/* Logo */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Logo del sello
				</label>
				<input
					type="file"
					name="picture"
					accept="image/*"
					onChange={handleFileChange}
					className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
				/>
				{formData.picturePreview && (
					<div className="mt-3">
						<img
							src={formData.picturePreview}
							alt="Vista previa"
							className="max-h-40 rounded-lg border"
						/>
					</div>
				)}
			</div>

			{/* Nombre */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Nombre del sello
				</label>
				<input
					type="text"
					name="name"
					value={formData.name}
					onChange={handleChange}
					className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black"
				/>
			</div>

			{/* Email */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Email
				</label>
				<input
					type="email"
					name="email"
					value={formData.email}
					onChange={handleChange}
					className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black"
				/>
			</div>

			{/* Password */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Password
				</label>
				<input
					type="password"
					name="password"
					value={formData.password}
					onChange={handleChange}
					className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black"
				/>
			</div>

			{/* Rol */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Rol
				</label>
				<select
					name="role"
					value={formData.role}
					onChange={handleChange}
					className="w-full border border-gray-300 p-2 rounded-lg bg-white focus:ring-2 focus:ring-black"
				>
					<option value="">Selecciona un rol</option>
					<option value="admin">Admin</option>
					<option value="sello">Sello</option>
					<option value="artista">Artista</option>
				</select>
			</div>

			{/* Género */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Género principal
				</label>
				<select
					name="primary_genre"
					value={formData.primary_genre?.id ?? ''}
					onChange={handleSelectChange}
					className="w-full border border-gray-300 p-2 rounded-lg bg-white focus:ring-2 focus:ring-black"
				>
					<option value="">Selecciona un género</option>
					{genres.map(genre => (
						<option key={genre.id} value={genre.id}>
							{genre.name}
						</option>
					))}
				</select>
				{formData.primary_genre && (
					<p className="mt-1 text-sm text-gray-500">
						Seleccionado: {formData.primary_genre.name}
					</p>
				)}
			</div>

			{/* Año y catálogo */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Año
					</label>
					<input
						type="text"
						name="year"
						value={formData.year}
						onChange={handleChange}
						maxLength={4}
						className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Número catálogo
					</label>
					<input
						type="text"
						name="catalog_num"
						value={formData.catalog_num}
						onChange={handleChange}
						maxLength={10}
						className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black"
					/>
				</div>
			</div>

			{/* Submit */}
			{Msg && (
				<p className="bg-green-200 text-center text-green-800 py-2">{Msg}</p>
			)}
			<div className="pt-4">
				<button
					type="submit"
					className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-900 transition"
				>
					Guardar sello
				</button>
			</div>
		</form>
	);
};

export default FormSello;
