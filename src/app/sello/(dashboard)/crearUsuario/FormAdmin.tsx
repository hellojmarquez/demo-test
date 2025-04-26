'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
	name: string;
	email: string;
	password: string;
	picture: File | null;
	picturePreview: string;
}

const FormAdmin = () => {
	const [formData, setFormData] = useState<FormData>({
		name: '',
		email: '',
		password: '',
		picture: null,
		picturePreview: '',
	});
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith('image/')) {
				alert('Por favor, selecciona un archivo de imagen válido.');
				return;
			}
			const previewUrl = URL.createObjectURL(file);
			setFormData(prev => ({
				...prev,
				picture: file,
				picturePreview: previewUrl,
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		const submitData = new FormData();
		submitData.append('name', formData.name);
		submitData.append('email', formData.email);
		submitData.append('password', formData.password);
		submitData.append('role', 'admin');
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
				alert('Administrador creado exitosamente');
				// Reset form
				setFormData({
					name: '',
					email: '',
					password: '',
					picture: null,
					picturePreview: '',
				});
				router.refresh();
			} else {
				alert(data.message || 'Error al crear el administrador');
			}
		} catch (error) {
			console.error('Error al crear administrador:', error);
			alert('Error al crear administrador');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Foto de perfil
				</label>
				<input
					type="file"
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

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Nombre
				</label>
				<input
					type="text"
					name="name"
					value={formData.name}
					onChange={handleChange}
					required
					className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Email
				</label>
				<input
					type="email"
					name="email"
					value={formData.email}
					onChange={handleChange}
					required
					className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Contraseña
				</label>
				<input
					type="password"
					name="password"
					value={formData.password}
					onChange={handleChange}
					required
					className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
			>
				{loading ? 'Creando...' : 'Crear Administrador'}
			</button>
		</form>
	);
};

export default FormAdmin;
