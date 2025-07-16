'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import CreateAdminModal from '@/components/createAdminModal';
import CreateArtistModal from '@/components/createArtistModal';
import CreateSelloModal from '@/components/createSelloModal';
import CreateContributorModal from '@/components/CreateContributorModal';
import { CreatePublisherModal } from '@/components/CreatePublisherModal';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

import Select, { SingleValue } from 'react-select';

interface AccountOption {
	value: string;
	label: string;
}

// Styles for react-select components
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
			? '#4B5563' // brand-dark color
			: state.isFocused
			? '#F3F4F6'
			: 'white',
		color: state.isSelected ? 'white' : '#1F2937',
		'&:hover': {
			backgroundColor: state.isSelected
				? '#4B5563' // brand-dark color
				: '#F3F4F6',
		},
	}),
	menu: (base: any) => ({
		...base,
		zIndex: 9999,
	}),
};

export default function CrearUsuarioPage() {
	const [userType, setUserType] = useState<string>('');
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [successUserType, setSuccessUserType] = useState<string>('');
	const [userRole, setUserRole] = useState<string>('');
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [selloData, setSelloData] = useState<any>(null);
	const router = useRouter();
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		tipo: 'principal',
		parentId: '',
		parentName: '',
	});
	const { user } = useAuth();

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
	};

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
								const res = await response.json();

								if (!response.ok) {
									const errorMessage =
										typeof res.error === 'object'
											? Object.entries(res.error)
													.map(([key, value]) => {
														if (Array.isArray(value)) {
															return `${key}: ${value.join(', ')}`;
														}
														if (typeof value === 'object' && value !== null) {
															return `${key}: ${Object.values(value).join(
																', '
															)}`;
														}
														return `${key}: ${value}`;
													})
													.filter(Boolean)
													.join('\n')
											: res.error;
									toast.error(errorMessage);
									throw new Error(errorMessage);
								}

								toast.success('Administrador creado exitosamente');
								setSuccessUserType('admin');
								setShowSuccessMessage(true);
								setUserType('');
								router.refresh();

								setTimeout(() => {
									setShowSuccessMessage(false);
									setSuccessUserType('');
								}, 5000);
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
								toast.success('Sello creado exitosamente');
								setSuccessUserType('sello');
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
										: typeof error === 'string'
										? error
										: 'Error al crear el artista'
								);
							}
						}}
					/>
				);
			case 'contribuidor':
				return (
					<CreateContributorModal
						isOpen={true}
						onClose={() => setUserType('')}
						onSave={async contributorData => {
							try {
								setSuccessUserType('contribuidor');
								setShowSuccessMessage(true);
								setTimeout(() => {
									setShowSuccessMessage(false);
									setUserType('');
								}, 3000);
								router.refresh();
							} catch (error) {
								console.error('Error creating contributor:', error);
								toast.error(
									error instanceof Error
										? error.message
										: 'Error al crear el contribuidor'
								);
								throw error;
							}
						}}
					/>
				);
			case 'publisher':
				return (
					<CreatePublisherModal
						isOpen={true}
						onClose={() => setUserType('')}
						onCreate={async () => {
							try {
								setShowSuccessMessage(true);
								setTimeout(() => {
									setShowSuccessMessage(false);
									setUserType('');
								}, 3000);
								router.refresh();
							} catch (error) {
								console.error('Error creating publisher:', error);
								toast.error(
									error instanceof Error
										? error.message
										: 'Error al crear el publisher'
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
						{successUserType === 'admin'
							? 'Administrador creado exitosamente'
							: successUserType === 'sello'
							? 'Sello creado exitosamente'
							: successUserType === 'contribuidor'
							? 'Contribuidor creado exitosamente'
							: successUserType === 'publisher'
							? 'Publisher creado exitosamente'
							: 'Artista creado exitosamente'}
					</span>
				</motion.div>
			)}

			<h1 className="text-2xl font-bold text-blue-700 mb-6">
				{userRole === 'admin'
					? 'Actualizar Perfil de Sello'
					: 'Crear Nuevo Usuario'}
			</h1>

			{userRole === 'sello' ? (
				<div className="bg-white rounded-lg shadow p-6">
					{selloData && (
						<CreateSelloModal
							isOpen={showUpdateModal}
							onClose={() => setShowUpdateModal(false)}
							onSave={async selloData => {
								try {
									const response = await fetch('/api/admin/createSello', {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json',
										},
										body: JSON.stringify(selloData),
									});

									if (!response.ok) {
										const error = await response.json();
										throw new Error(error.message || 'Error al crear el sello');
									}

									setShowSuccessMessage(true);
									setTimeout(() => {
										setShowSuccessMessage(false);
									}, 3000);
									router.refresh();
								} catch (error) {
									console.error('Error creating sello:', error);
									toast.error(
										error instanceof Error
											? error.message
											: 'Error al crear el sello'
									);
								}
							}}
						/>
					)}
				</div>
			) : (
				<div className="space-y-6">
					<div className="bg-white rounded-lg shadow p-6">
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Tipo de Usuario
								</label>
								<Select<AccountOption>
									value={
										userType
											? {
													value: userType,
													label:
														userType === 'admin'
															? 'Administrador'
															: userType === 'sello'
															? 'Sello'
															: userType === 'artista'
															? 'Artista'
															: userType === 'contribuidor'
															? 'Contribuidor'
															: userType === 'publisher'
															? 'Publisher'
															: '',
											  }
											: null
									}
									onChange={(selectedOption: SingleValue<AccountOption>) => {
										setUserType(selectedOption?.value || '');
									}}
									options={[
										...(user?.role === 'admin'
											? [{ value: 'admin', label: 'Administrador' }]
											: []),
										{ value: 'sello', label: 'Sello' },
										{ value: 'artista', label: 'Artista' },
										{ value: 'contribuidor', label: 'Contribuidor' },
										{ value: 'publisher', label: 'Publisher' },
									]}
									placeholder="Seleccionar tipo de usuario"
									isClearable
									className="react-select-container"
									classNamePrefix="react-select"
									styles={reactSelectStyles}
								/>
							</div>
						</div>
					</div>

					{userType && (
						<div className="bg-white rounded-lg shadow p-6">
							<div className="space-y-4">
								<h2 className="text-xl font-semibold text-gray-800">
									{userType === 'admin'
										? 'Crear Administrador'
										: userType === 'sello'
										? 'Crear Sello'
										: userType === 'contribuidor'
										? 'Crear Contribuidor'
										: userType === 'publisher'
										? 'Crear Publisher'
										: 'Crear Artista'}
								</h2>
								{renderForm()}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
