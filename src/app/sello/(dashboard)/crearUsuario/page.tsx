'use client';

import { useState, useEffect } from 'react';
import CreateAdminModal from '@/components/createAdminModal';
import CreateArtistModal from '@/components/createArtistModal';
import CreateSelloModal from '@/components/createSelloModal';
import CreateContributorModal from '@/components/CreateContributorModal';
import { CreatePublisherModal } from '@/components/CreatePublisherModal';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, X, Save, ChevronDown } from 'lucide-react';
import UpdateSelloModal from '@/components/UpdateSelloModal';
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

	const [parentAccounts, setParentAccounts] = useState<
		Array<{ _id: string; name: string }>
	>([]);

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
							createdAt: data.user.createdAt || new Date().toISOString(),
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

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const response = await fetch('/api/admin/createUser', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				toast.success('Usuario creado exitosamente');
				router.push('/sello/dashboard');
			} else {
				const data = await response.json();
				toast.error(data.message || 'Error al crear el usuario');
			}
		} catch (error) {
			console.error('Error creating user:', error);
			toast.error('Error al crear el usuario');
		}
	};

	// Fetch parent accounts when tipo changes to 'subcuenta'
	useEffect(() => {
		const fetchParentAccounts = async () => {
			if (formData.tipo === 'subcuenta') {
				try {
					const response = await fetch('/api/admin/getAllUsers');
					if (response.ok) {
						const data = await response.json();
						const mainAccounts = data.users
							.filter((user: any) => user.tipo === 'principal')
							.map((user: any) => ({
								_id: user._id,
								name: user.name,
							}));
						setParentAccounts(mainAccounts);
					}
				} catch (error) {
					console.error('Error fetching parent accounts:', error);
				}
			}
		};

		fetchParentAccounts();
	}, [formData.tipo]);

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
			case 'contribuidor':
				return (
					<CreateContributorModal
						isOpen={true}
						onClose={() => setUserType('')}
						onSave={async contributorData => {
							try {
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
						{userType === 'admin'
							? 'Administrador creado exitosamente'
							: userType === 'sello'
							? 'Sello creado exitosamente'
							: userType === 'contribuidor'
							? 'Contribuidor creado exitosamente'
							: userType === 'publisher'
							? 'Publisher creado exitosamente'
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
							<h2 className="text-xl font-semibold text-gray-800">
								Crear Nuevo Usuario
							</h2>
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
										{ value: 'admin', label: 'Administrador' },
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
