'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
	name: string;
	email: string;
	password: string;
	role: string;
	picture: File | null;
	picturePreview: string;
	primary_genre: string;
	year: string;
	catalog_num: string;
}

const FormArtista = () => {
	const [formData, setFormData] = useState<FormData>({
		name: '',
		email: '',
		password: '',
		role: '',
		picture: null,
		picturePreview: '',
		primary_genre: '',
		year: '',
		catalog_num: '',
	});
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && file.type.startsWith('image/')) {
			const previewUrl = URL.createObjectURL(file);
			setFormData(prev => ({
				...prev,
				picture: file,
				picturePreview: previewUrl,
			}));
		} else {
			alert('Por favor, selecciona un archivo de imagen válido.');
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		const submitData = new FormData();
		submitData.append('name', formData.name);
		submitData.append('email', formData.email);
		submitData.append('password', formData.password);
		submitData.append('role', formData.role);
		submitData.append('primary_genre', formData.primary_genre);
		submitData.append('year', formData.year);
		submitData.append('catalog_num', formData.catalog_num);
		if (formData.picture) {
			submitData.append('picture', formData.picture);
		}

		try {
			const res = await fetch('/api/admin/createUser', {
				method: 'POST',
				body: submitData,
			});
			const data = await res.json();
			if (data.success) {
				alert('Usuario creado exitosamente');
				setFormData({
					name: '',
					email: '',
					password: '',
					role: '',
					picture: null,
					picturePreview: '',
					primary_genre: '',
					year: '',
					catalog_num: '',
				});
				router.refresh();
			} else {
				alert(data.message || 'Error al crear el usuario');
			}
		} catch (error) {
			console.error('Error al crear usuario:', error);
			alert('Error al crear usuario');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<label className="block mb-2 text-sm font-medium">Foto</label>
				<input
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					className="w-full"
				/>
				{formData.picturePreview && (
					<img
						src={formData.picturePreview}
						alt="Preview"
						className="mt-3 max-h-40 rounded border"
					/>
				)}
			</div>

			<input
				type="text"
				name="name"
				value={formData.name}
				onChange={handleChange}
				required
				placeholder="Nombre"
				className="w-full p-2 border rounded"
			/>

			<input
				type="email"
				name="email"
				value={formData.email}
				onChange={handleChange}
				required
				placeholder="Email"
				className="w-full p-2 border rounded"
			/>

			<input
				type="password"
				name="password"
				value={formData.password}
				onChange={handleChange}
				required
				placeholder="Contraseña"
				className="w-full p-2 border rounded"
			/>

			<select
				name="role"
				value={formData.role}
				onChange={handleChange}
				required
				className="w-full p-2 border rounded"
			>
				<option value="" disabled>
					Selecciona un rol
				</option>
				<option value="artista">Artista</option>
				<option value="sello">Sello</option>
			</select>

			<input
				type="text"
				name="primary_genre"
				value={formData.primary_genre}
				onChange={handleChange}
				placeholder="Género principal"
				className="w-full p-2 border rounded"
			/>

			<input
				type="text"
				name="year"
				value={formData.year}
				onChange={handleChange}
				placeholder="Año"
				className="w-full p-2 border rounded"
			/>

			<input
				type="text"
				name="catalog_num"
				value={formData.catalog_num}
				onChange={handleChange}
				placeholder="Número de catálogo"
				className="w-full p-2 border rounded"
			/>

			<button
				type="submit"
				disabled={loading}
				className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
			>
				{loading ? 'Creando...' : 'Crear'}
			</button>
		</form>
	);
};

export default FormArtista;
