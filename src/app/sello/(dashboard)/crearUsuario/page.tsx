'use client';

import { useState } from 'react';
import FormAdmin from './FormAdmin';
import FormSello from './FormSello';
import FormArtista from './FormArtista';

export default function CrearUsuarioPage() {
	const [userType, setUserType] = useState<string>('');

	const renderForm = () => {
		switch (userType) {
			case 'admin':
				return <FormAdmin />;
			case 'sello':
				return <FormSello />;
			case 'artista':
				return <FormArtista />;
			default:
				return (
					<div className="text-center py-8">
						<p className="text-gray-600 mb-4">
							Selecciona un tipo de usuario para continuar
						</p>
					</div>
				);
		}
	};

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-2xl font-bold text-blue-700 mb-6">
				Crear Nuevo Usuario
			</h1>

			<div className="mb-6">
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Tipo de Usuario
				</label>
				<select
					value={userType}
					onChange={e => setUserType(e.target.value)}
					className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
				>
					<option value="">Selecciona un tipo de usuario</option>
					<option value="admin">Administrador</option>
					<option value="sello">Sello</option>
					<option value="artista">Artista</option>
				</select>
			</div>

			<div className="bg-white rounded-lg shadow p-6">{renderForm()}</div>
		</div>
	);
}
