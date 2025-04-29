'use client';

import { useState } from 'react';
import FormAdmin from './FormAdmin';
import FormSello from './FormSello';
import FormArtista from './FormArtista';
import CreateAdminModal from '@/components/createAdminModal';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function CrearUsuarioPage() {
	const [userType, setUserType] = useState<string>('');
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const router = useRouter();

	const renderForm = () => {
		switch (userType) {
			case 'admin':
				return (
					<CreateAdminModal
						isOpen={true}
						onClose={() => setUserType('')}
						onSave={async adminData => {
							try {
								const response = await fetch('/api/admin/createAdmin', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
									},
									body: JSON.stringify(adminData),
								});

								if (!response.ok) {
									const error = await response.json();
									throw new Error(
										error.message || 'Error al crear el administrador'
									);
								}

								setShowSuccessMessage(true);
								setTimeout(() => setShowSuccessMessage(false), 3000);
								setUserType('');
								router.refresh();
							} catch (error) {
								console.error('Error creating admin:', error);
								toast.error(
									error instanceof Error
										? error.message
										: 'Error al crear el administrador'
								);
								throw error;
							}
						}}
					/>
				);
			case 'sello':
				return;
			case 'artista':
				return;
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
			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2"
				>
					<CheckCircle size={18} />
					<span>Administrador creado exitosamente</span>
				</motion.div>
			)}

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
