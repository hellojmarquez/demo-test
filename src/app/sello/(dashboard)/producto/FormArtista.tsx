'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type FormProductsProps = {
	tipoProducto: string;
};

type Sello = {
	id: number;
	name: string;
};

interface FormData {
	name: string;
	avatar: File | null;
	avatarPreview: string;
	amazonId: string;
	appleId: string;
	deezerId: string;
	spotifyId: string;
	email: string;
	password: string;
}

export default function FormArtista({ tipoProducto }: FormProductsProps) {
	const router = useRouter();
	const [sellos, setSellos] = useState<Sello[]>([]);
	const [artistData, setArtistData] = useState<FormData>({
		name: '',
		avatar: null,
		avatarPreview: '',
		amazonId: '',
		appleId: '',
		deezerId: '',
		spotifyId: '',
		email: '',
		password: '',
	});

	useEffect(() => {
		fetch('/api/admin/getAllSellos')
			.then(res => {
				if (res.status === 401) {
					router.push('/sello/login');
					return;
				}
				return res.json();
			})
			.then(response => setSellos(response.data as Sello[]));
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setArtistData(prev => ({ ...prev, [name]: value }));
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && file.type.startsWith('image/')) {
			const previewUrl = URL.createObjectURL(file);
			setArtistData(prev => ({
				...prev,
				avatar: file,
				avatarPreview: previewUrl,
			}));
		} else {
			alert('Por favor, selecciona una imagen válida.');
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const form = new FormData();
		const { avatar, ...data } = artistData;

		Object.entries(data).forEach(([key, value]) => form.append(key, value));

		if (avatar) {
			form.append('avatar', avatar, avatar.name);
		}

		fetch('/api/admin/createArtist', {
			method: 'POST',
			body: form,
		})
			.then(res => res.json())
			.then(console.log);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Perfil */}
			<div>
				<label className="block text-sm font-medium mb-1">Foto de perfil</label>
				<input
					type="file"
					accept="image/*"
					onChange={handleImageChange}
					className="w-full border rounded px-3 py-2 text-sm"
				/>
				{artistData.avatarPreview && (
					<div className="mt-3">
						<p className="text-sm text-gray-600 mb-1">Vista previa:</p>
						<img
							src={artistData.avatarPreview}
							alt="Vista previa del artista"
							className="max-h-40 border rounded"
						/>
					</div>
				)}
			</div>

			{/* Información básica */}
			<div className="space-y-3">
				<label className="block text-sm font-medium">Nombre del artista</label>
				<input
					type="text"
					name="name"
					value={artistData.name}
					onChange={handleChange}
					className="w-full border rounded px-3 py-2 text-sm"
				/>
			</div>

			{/* Identificadores de plataforma */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<input
					type="text"
					name="amazonId"
					placeholder="Amazon Music ID"
					value={artistData.amazonId}
					onChange={handleChange}
					className="w-full border rounded px-3 py-2 text-sm"
				/>
				<input
					type="text"
					name="appleId"
					placeholder="Apple Music ID"
					value={artistData.appleId}
					onChange={handleChange}
					className="w-full border rounded px-3 py-2 text-sm"
				/>
				<input
					type="text"
					name="deezerId"
					placeholder="Deezer ID"
					value={artistData.deezerId}
					onChange={handleChange}
					className="w-full border rounded px-3 py-2 text-sm"
				/>
				<input
					type="text"
					name="spotifyId"
					placeholder="Spotify ID"
					value={artistData.spotifyId}
					onChange={handleChange}
					className="w-full border rounded px-3 py-2 text-sm"
				/>
			</div>

			{/* Acceso */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<input
					type="email"
					name="email"
					placeholder="Correo electrónico"
					value={artistData.email}
					onChange={handleChange}
					className="w-full border rounded px-3 py-2 text-sm"
				/>
				<input
					type="text"
					name="password"
					placeholder="Contraseña"
					value={artistData.password}
					onChange={handleChange}
					className="w-full border rounded px-3 py-2 text-sm"
				/>
			</div>

			{/* Botón */}
			<div className="flex justify-end">
				<button
					type="submit"
					className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 text-sm font-medium"
				>
					Crear artista
				</button>
			</div>
		</form>
	);
}
