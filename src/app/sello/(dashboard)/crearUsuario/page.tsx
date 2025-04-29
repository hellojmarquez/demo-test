'use client';

import { useState, useEffect } from 'react';
import CreateAdminModal from '@/components/createAdminModal';
import CreateArtistModal from '@/components/createArtistModal';
import CreateSelloModal from '@/components/createSelloModal';
import UpdateSelloModal from '@/components/UpdateSelloModal';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function CrearUsuarioPage() {
	const [userType, setUserType] = useState<string>('');
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [userRole, setUserRole] = useState<string>('');
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [selloData, setSelloData] = useState<any>(null);
	const router = useRouter();

	// Obtener el rol del usuario actual
	useEffect(() => {
		const fetchUserRole = async () => {
			try {
				const response = await fetch('/api/auth/me');
				if (response.ok) {
					const data = await response.json();
					setUserRole(data.user.role);
					setCurrentUser(data.user);

					// Si el usuario es un sello, mostrar el modal de actualización
					if (data.user.role === 'sello') {
						// Adaptar los datos del usuario al formato esperado por UpdateSelloModal
						const adaptedSelloData = {
							_id: data.user._id,
							name: data.user.name,
							picture: data.user.picture,
							catalog_num: data.user.catalog_num || 0,
							year: data.user.year || 0,
							status: data.user.status || 'active',
							contract_received: data.user.contract_received || false,
							information_accepted: data.user.information_accepted || false,
							label_approved: data.user.label_approved || false,
							assigned_artists: data.user.assigned_artists || [],
							created_at: data.user.createdAt || new Date().toISOString(),
							updatedAt: data.user.updatedAt || new Date().toISOString(),
						};
						setSelloData(adaptedSelloData);
						setShowUpdateModal(true);
					}
				}
			} catch (error) {
				console.error('Error fetching user role:', error);
			}
		};

		fetchUserRole();
	}, []);

	const renderForm = () => {
		// Si el usuario es un sello, no mostrar el formulario de creación
		if (userRole === 'sello') {
			return null;
		}

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
								setTimeout(() => {
									setShowSuccessMessage(false);
									setUserType('');
								}, 3000);
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
				return (
					<CreateSelloModal
						isOpen={true}
						onClose={() => setUserType('')}
						onSave={async selloData => {
							try {
								setShowSuccessMessage(true);
								setTimeout(() => {
									setShowSuccessMessage(false);
									setUserType('');
								}, 3000);
								router.refresh();
							} catch (error) {
								console.error('Error creating sello:', error);
								toast.error(
									error instanceof Error
										? error.message
										: 'Error al crear el sello'
								);
								throw error;
							}
						}}
					/>
				);
			case 'artista':
				return (
					<CreateArtistModal
						isOpen={true}
						onClose={() => setUserType('')}
						onSave={async artistData => {
							try {
								setShowSuccessMessage(true);
								setTimeout(() => {
									setShowSuccessMessage(false);
									setUserType('');
								}, 3000);
								router.refresh();
							} catch (error) {
								console.error('Error creating artist:', error);
								toast.error(
									error instanceof Error
										? error.message
										: 'Error al crear el artista'
								);
								throw error;
							}
						}}
					/>
				);
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
					<span>
						{userType === 'admin'
							? 'Administrador creado exitosamente'
							: userType === 'sello'
							? 'Sello creado exitosamente'
							: 'Artista creado exitosamente'}
					</span>
				</motion.div>
			)}

			<h1 className="text-2xl font-bold text-blue-700 mb-6">
				{userRole === 'sello'
					? 'Actualizar Perfil de Sello'
					: 'Crear Nuevo Usuario'}
			</h1>

			{userRole === 'sello' ? (
				<div className="bg-white rounded-lg shadow p-6">
					{selloData && (
						<UpdateSelloModal
							isOpen={showUpdateModal}
							onClose={() => setShowUpdateModal(false)}
							onSave={async updatedSello => {
								try {
									// Enviar los datos actualizados al servidor
									const response = await fetch(
										`/api/admin/updateSello/${updatedSello._id}`,
										{
											method: 'PUT',
											headers: {
												'Content-Type': 'application/json',
											},
											body: JSON.stringify(updatedSello),
										}
									);

									if (!response.ok) {
										const error = await response.json();
										throw new Error(
											error.message || 'Error al actualizar el sello'
										);
									}

									setShowSuccessMessage(true);
									setTimeout(() => {
										setShowSuccessMessage(false);
									}, 3000);
									router.refresh();
								} catch (error) {
									console.error('Error updating sello:', error);
									toast.error(
										error instanceof Error
											? error.message
											: 'Error al actualizar el sello'
									);
								}
							}}
							sello={selloData}
						/>
					)}
				</div>
			) : (
				<>
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
				</>
			)}
		</div>
	);
}
