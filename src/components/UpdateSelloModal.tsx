import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	X,
	Save,
	Image as ImageIcon,
	XCircle,
	Upload,
	Plus,
	Trash2,
	Users,
	UserPlus,
	ChevronDown,
	Mail,
	Lock,
	Calendar,
	Hash,
	User,
	Building,
	CheckCircle,
	UserRoundCheck,
	FileText,
	Percent,
	DollarSign,
} from 'lucide-react';
import { Sello } from '@/types/sello';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Select, { SingleValue } from 'react-select';

interface UpdateSelloModalProps {
	sello: Sello;
	isOpen: boolean;
	onClose: () => void;
	onSave: (formData: FormData) => Promise<void>;
}

interface AccountOption {
	value: string;
	label: string;
}

const UpdateSelloModal: React.FC<UpdateSelloModalProps> = ({
	sello,
	isOpen,
	onClose,
	onSave,
}) => {
	const router = useRouter();
	// Generate years array from 1900 to current year
	const currentYear = new Date().getFullYear();
	const years = Array.from(
		{ length: currentYear - 1899 },
		(_, i) => currentYear - i
	).map(year => ({
		value: year.toString(),
		label: year.toString(),
	}));

	const [formData, setFormData] = useState<Sello>({
		...sello,
		assigned_artists: sello.assigned_artists || [],
		tipo: sello.tipo || 'principal',
		parentId: sello.parentId || null,
		subaccounts: sello.subaccounts || [],
		email: sello.email || '',
		password: sello.password || '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(() => {
		if (!sello.picture) return null;
		if (typeof sello.picture === 'string') return sello.picture;
		if ('base64' in sello.picture) return sello.picture.base64;
		return null;
	});
	const [parentAccounts, setParentAccounts] = useState<
		Array<{ _id: string; name: string }>
	>([]);
	const [availableSubaccounts, setAvailableSubaccounts] = useState<
		Array<{ _id: string; name: string }>
	>([]);
	const [selectedSubaccount, setSelectedSubaccount] = useState<string>('');
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [removedSubaccounts, setRemovedSubaccounts] = useState<
		Array<{ _id: string; name: string }>
	>([]);
	const [asignaciones, setAsignaciones] = useState<Array<any>>([]);
	const [loadingAsignaciones, setLoadingAsignaciones] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [availableArtists, setAvailableArtists] = useState<
		Array<{ _id: string; name: string }>
	>([]);
	const [newAsignaciones, setNewAsignaciones] = useState<Array<any>>([]);
	const [removedAsignaciones, setRemovedAsignaciones] = useState<Array<string>>(
		[]
	);
	const [newAsignacion, setNewAsignacion] = useState({
		artista_id: '',
		fecha_inicio: '',
		fecha_fin: '',
		tipo_contrato: 'exclusivo' as 'exclusivo' | 'no_exclusivo',
		porcentaje_distribucion: 80,
	});
	const [extendedLimit, setExtendedLimit] = useState({
		limit: 3,
		endDate: '',
		paymentDetails: {
			amount: 0,
			transactionId: '',
		},
	});
	const [currentLimit, setCurrentLimit] = useState<any>(null);

	// Update the input styles to accommodate icons
	const inputStyles =
		'w-full pl-10 pr-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';
	const selectStyles =
		'w-full pl-10 pr-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent appearance-none cursor-pointer relative pr-8';

	// Add a custom select wrapper style
	const selectWrapperStyles = 'relative';

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

	// Obtener la lista de cuentas principales y subcuentas disponibles
	useEffect(() => {
		const fetchAccounts = async () => {
			try {
				const response = await fetch('/api/admin/getAllUsers');
				if (response.ok) {
					const data = await response.json();

					// Filtrar solo las cuentas principales
					const mainAccounts = data.users
						.filter((user: any) => user.tipo === 'principal')
						.map((user: any) => ({
							_id: user._id,
							name: user.name,
						}));
					setParentAccounts(mainAccounts);

					// Filtrar subcuentas disponibles
					const subaccounts = data.users
						.filter((user: any) => {
							return (
								user.tipo === 'subcuenta' &&
								!user.parentId &&
								user._id !== sello._id
							);
						})
						.map((user: any) => ({
							_id: user._id,
							name: user.name,
						}));

					setAvailableSubaccounts(subaccounts);
				}
			} catch (error) {
				console.error('Error fetching accounts:', error);
			}
		};

		if (isOpen) {
			fetchAccounts();
		}
	}, [isOpen, sello._id]);

	// Actualizar la previsualización cuando cambia el sello seleccionado
	useEffect(() => {
		if (!sello.picture) {
			setImagePreview(null);
			return;
		}
		if (typeof sello.picture === 'string') {
			setImagePreview(sello.picture);
		} else if ('base64' in sello.picture) {
			setImagePreview(sello.picture.base64);
		} else {
			setImagePreview(null);
		}
	}, [sello]);

	// Cargar asignaciones cuando se abre el modal
	useEffect(() => {
		const fetchAsignaciones = async () => {
			if (isOpen && sello._id) {
				setLoadingAsignaciones(true);
				try {
					const response = await fetch(
						`/api/admin/getAsignaciones?sello_id=${sello._id}`
					);
					if (response.ok) {
						const data = await response.json();
						setAsignaciones(data.data || []);
					}
				} catch (error) {
					console.error('Error fetching asignaciones:', error);
				} finally {
					setLoadingAsignaciones(false);
				}
			}
		};

		fetchAsignaciones();
	}, [isOpen, sello._id]);

	// Cargar artistas disponibles
	useEffect(() => {
		const fetchArtists = async () => {
			try {
				const response = await fetch('/api/admin/getAllArtists');
				if (response.ok) {
					const data = await response.json();
					// Filtrar solo los artistas que no están asignados a ningún sello
					const artists = data.data
						.filter((user: any) => user.role === 'artista' && !user.parentId)
						.map((user: any) => ({
							_id: user._id,
							name: user.name,
						}));
					setAvailableArtists(artists);
					console.log('artists: ', data.data);
				}
			} catch (error) {
				console.error('Error fetching artists:', error);
			}
		};

		if (isOpen) {
			fetchArtists();
		}
	}, [isOpen]);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value, type } = e.target;

		if (name === 'year' || name === 'catalog_num') {
			// Solo permitir números
			if (/^\d*$/.test(value)) {
				setFormData({
					...formData,
					[name]: value === '' ? 0 : parseInt(value),
				});
			}
		} else if (name === 'parentId') {
			// Cuando cambia el parentId, actualizar también el parentName
			const selectedParent = parentAccounts.find(
				account => account._id === value
			);
			setFormData({
				...formData,
				parentId: value,
				parentName: selectedParent?.name || null,
			});
		} else if (name === 'tipo') {
			// Cuando cambia el tipo de cuenta
			if (value === 'subcuenta') {
				// Si cambia a subcuenta, limpiar las subcuentas propias
				setFormData(prev => ({
					...prev,
					tipo: 'subcuenta' as const,
					subaccounts: [],
					// Si ya tiene un parentId, mantenerlo
					parentId: prev.parentId || null,
					parentName: prev.parentName || null,
				}));
			} else {
				// Si cambia a principal, limpiar parentId y parentName
				setFormData(prev => ({
					...prev,
					tipo: 'principal' as const,
					parentId: null,
					parentName: null,
					subaccounts: prev.subaccounts || [],
				}));

				// Actualizar las subcuentas disponibles
				const fetchAvailableSubaccounts = async () => {
					try {
						const response = await fetch('/api/admin/getAllUsers');
						if (response.ok) {
							const data = await response.json();

							const subaccounts = data.users
								.filter(
									(user: any) =>
										user.tipo === 'subcuenta' &&
										!user.parentId &&
										user._id !== sello._id
								)
								.map((user: any) => ({
									_id: user._id,
									name: user.name,
								}));

							setAvailableSubaccounts(subaccounts);
						}
					} catch (error) {
						console.error('Error fetching available subaccounts:', error);
					}
				};
				fetchAvailableSubaccounts();
			}
		} else {
			setFormData({
				...formData,
				[name]: value,
			});
		}
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Guardar el archivo directamente
			setFormData(prev => ({
				...prev,
				picture: file,
			}));

			// Crear una URL para la vista previa
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		if (name === 'year') {
			// Solo permitir números y máximo 4 dígitos
			if (/^\d{0,4}$/.test(value)) {
				setFormData({
					...formData,
					[name]: value === '' ? 0 : parseInt(value),
				});
			}
		} else if (name === 'catalog_num') {
			// Solo permitir enteros positivos para el número de catálogo
			const regex = /^\d*$/;

			if (regex.test(value)) {
				setFormData({
					...formData,
					[name]: value === '' ? 0 : parseInt(value),
				});
			}
		} else {
			// Para otros campos
			setFormData({
				...formData,
				[name]: value,
			});
		}
	};

	const handleRemoveSubaccount = (subaccountId: string) => {
		const subaccount = formData.subaccounts?.find(
			sub => sub._id === subaccountId
		);
		if (!subaccount) return;

		// Agregar la subcuenta a la lista de removidas
		setRemovedSubaccounts(prev => [...prev, subaccount]);

		// Actualizar el estado local
		setFormData(prev => ({
			...prev,
			subaccounts:
				prev.subaccounts?.filter(sub => sub._id !== subaccountId) || [],
		}));

		// Agregar la subcuenta de vuelta a las disponibles
		setAvailableSubaccounts(prev => [...prev, subaccount]);
	};

	const handleAsignarArtista = () => {
		if (!newAsignacion.artista_id) {
			alert('Por favor selecciona un artista');
			return;
		}

		// Encontrar el artista seleccionado para mostrar su nombre
		const artistaSeleccionado = availableArtists.find(
			a => a._id === newAsignacion.artista_id
		);
		if (!artistaSeleccionado) return;

		// Agregar la nueva asignación a la lista temporal
		setNewAsignaciones(prev => [
			...prev,
			{
				...newAsignacion,
				artista_id: {
					_id: artistaSeleccionado._id,
					name: artistaSeleccionado.name,
				},
				_id: `temp_${Date.now()}`, // ID temporal para identificar la asignación
			},
		]);

		// Limpiar el formulario
		setNewAsignacion({
			artista_id: '',
			fecha_inicio: '',
			fecha_fin: '',
			tipo_contrato: 'exclusivo',
			porcentaje_distribucion: 80,
		});

		setShowSuccessMessage(true);
		setTimeout(() => setShowSuccessMessage(false), 3000);
	};

	const handleRemoveArtist = (asignacionId: string) => {
		if (asignacionId.startsWith('temp_')) {
			// Si es una asignación temporal, solo la removemos de newAsignaciones
			setNewAsignaciones(prev => prev.filter(a => a._id !== asignacionId));
		} else {
			// Si es una asignación existente, la agregamos a removedAsignaciones
			setRemovedAsignaciones(prev => [...prev, asignacionId]);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Primero procesar las asignaciones eliminadas
			for (const asignacionId of removedAsignaciones) {
				await fetch(
					`/api/admin/deleteAsignacion?asignacion_id=${asignacionId}`,
					{
						method: 'DELETE',
					}
				);
			}

			// Luego crear las nuevas asignaciones
			for (const asignacion of newAsignaciones) {
				await fetch('/api/admin/createAsignacion', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						sello_id: sello._id,
						artista_id: asignacion.artista_id._id,
						fecha_inicio: asignacion.fecha_inicio,
						fecha_fin: asignacion.fecha_fin,
						tipo_contrato: asignacion.tipo_contrato,
						porcentaje_distribucion: asignacion.porcentaje_distribucion,
					}),
				});
			}

			// Procesar el resto de la actualización del sello
			const formDataToSend = new FormData();
			formDataToSend.append('_id', formData._id);
			const dataToSend = {
				...formData,
				year: parseInt(formData.year.toString()) || 0,
				catalog_num: parseInt(formData.catalog_num.toString()) || 0,
				external_id: formData.external_id
					? parseInt(formData.external_id.toString())
					: undefined,
				picture:
					typeof formData.picture === 'string' ? formData.picture : undefined,
			};
			formDataToSend.append('data', JSON.stringify(dataToSend));

			if (formData.picture instanceof File) {
				formDataToSend.append('picture', formData.picture);
			}

			await onSave(formDataToSend);

			// Si hay un nuevo límite extendido, crearlo
			if (extendedLimit.limit > 0 && extendedLimit.endDate) {
				await fetch('/api/admin/sello-limits', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						sello_id: sello._id,
						extendedLimit: extendedLimit.limit,
						endDate: extendedLimit.endDate,
						paymentDetails: extendedLimit.paymentDetails,
					}),
				});
			}

			// Limpiar los estados de asignaciones
			setNewAsignaciones([]);
			setRemovedAsignaciones([]);
			setRemovedSubaccounts([]);
			setExtendedLimit({
				limit: 0,
				endDate: '',
				paymentDetails: {
					amount: 0,
					transactionId: '',
				},
			});

			onClose();
		} catch (error) {
			console.error('Error saving sello:', error);
			alert('Error al guardar los cambios. Por favor, intenta de nuevo.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAddSubaccount = () => {
		if (!selectedSubaccount) return;

		const subaccount = availableSubaccounts.find(
			sub => sub._id === selectedSubaccount
		);
		if (!subaccount) return;

		setFormData(prev => ({
			...prev,
			subaccounts: [...(prev.subaccounts || []), subaccount],
		}));

		// Remover la subcuenta de las disponibles
		setAvailableSubaccounts(prev =>
			prev.filter(sub => sub._id !== selectedSubaccount)
		);
		setSelectedSubaccount('');
	};

	const fetchCurrentLimit = async () => {
		try {
			const response = await fetch(
				`/api/admin/sello-limits?sello_id=${sello._id}`
			);
			const data = await response.json();
			if (data.success && data.data.length > 0) {
				const activeLimit = data.data.find(
					(limit: any) => limit.status === 'active'
				);
				setCurrentLimit(activeLimit);
			}
		} catch (error) {
			console.error('Error fetching current limit:', error);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
						onClick={e => e.stopPropagation()}
					>
						{/* Header */}
						<div className="p-6 border-b border-gray-200 flex justify-between items-center">
							<h2 className="text-xl font-semibold text-gray-800">
								Actualizar Sello
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						{/* Main Content */}
						<div className="p-6">
							<form onSubmit={handleSubmit} className="space-y-8">
								{/* Logo Section */}
								<div className="space-y-4">
									<label className="block text-sm font-medium text-gray-700">
										Logo del Sello
									</label>
									<div className="flex items-center gap-4">
										<div className="w-32 h-32 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
											{imagePreview ? (
												<img
													src={imagePreview}
													alt="Preview"
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="text-center">
													<ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
													<span className="mt-1 block text-xs text-gray-500">
														Sin imagen
													</span>
												</div>
											)}
										</div>
										<div>
											<input
												type="file"
												ref={fileInputRef}
												onChange={handleImageChange}
												accept="image/*"
												className="hidden"
											/>
											<button
												type="button"
												onClick={() => fileInputRef.current?.click()}
												className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
											>
												<Upload className="h-4 w-4 mr-2" />
												Cambiar imagen
											</button>
										</div>
									</div>
								</div>

								{/* Basic Information Section */}
								<div className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label
												htmlFor="name"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Nombre
											</label>
											<div className="relative">
												<User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
												<input
													type="text"
													id="name"
													name="name"
													value={formData.name}
													onChange={handleChange}
													className={inputStyles}
													required
												/>
											</div>
										</div>

										<div>
											<label
												htmlFor="catalog_num"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Número de Catálogo
											</label>
											<div className="relative">
												<Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
												<input
													type="text"
													id="catalog_num"
													name="catalog_num"
													value={formData.catalog_num}
													onChange={handleInputChange}
													onPaste={e => e.preventDefault()}
													className={inputStyles}
													required
												/>
											</div>
										</div>
									</div>

									<div>
										<label
											htmlFor="tipo"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Tipo de Cuenta
										</label>
										<Select<AccountOption>
											id="tipo"
											name="tipo"
											value={{
												value: formData.tipo,
												label:
													formData.tipo === 'principal'
														? 'Cuenta Principal'
														: 'Subcuenta',
											}}
											onChange={(
												selectedOption: SingleValue<AccountOption>
											) => {
												if (selectedOption) {
													handleChange({
														target: {
															name: 'tipo',
															value: selectedOption.value,
														},
													} as any);
												}
											}}
											options={[
												{ value: 'principal', label: 'Cuenta Principal' },
												{ value: 'subcuenta', label: 'Subcuenta' },
											]}
											className="react-select-container"
											classNamePrefix="react-select"
											styles={reactSelectStyles}
										/>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label
												htmlFor="email"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Correo Electrónico
											</label>
											<div className="relative">
												<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
												<input
													type="email"
													id="email"
													name="email"
													value={formData.email}
													onChange={handleChange}
													className={inputStyles}
													required
												/>
											</div>
										</div>

										<div>
											<label
												htmlFor="password"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Contraseña
											</label>
											<div className="relative">
												<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
												<input
													type="password"
													id="password"
													name="password"
													value={formData.password}
													onChange={handleChange}
													className={inputStyles}
													required
												/>
											</div>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label
												htmlFor="year"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Año
											</label>
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4 text-gray-400" />
												<div className="flex-1">
													<Select<AccountOption>
														id="year"
														name="year"
														value={{
															value: formData.year.toString(),
															label: formData.year.toString(),
														}}
														onChange={(
															selectedOption: SingleValue<AccountOption>
														) => {
															if (selectedOption) {
																handleChange({
																	target: {
																		name: 'year',
																		value: selectedOption.value,
																	},
																} as any);
															}
														}}
														options={years}
														className="react-select-container"
														classNamePrefix="react-select"
														styles={reactSelectStyles}
													/>
												</div>
											</div>
										</div>

										<div>
											<label
												htmlFor="status"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Estado
											</label>
											<div className="flex items-center gap-2">
												<UserRoundCheck className="h-4 w-4 text-gray-400" />
												<div className="flex-1">
													<Select<AccountOption>
														id="status"
														name="status"
														value={{
															value: formData.status,
															label:
																formData.status === 'active'
																	? 'Activo'
																	: 'Inactivo',
														}}
														onChange={(
															selectedOption: SingleValue<AccountOption>
														) => {
															if (selectedOption) {
																handleChange({
																	target: {
																		name: 'status',
																		value: selectedOption.value,
																	},
																} as any);
															}
														}}
														options={[
															{ value: 'active', label: 'Activo' },
															{ value: 'inactive', label: 'Inactivo' },
														]}
														className="react-select-container"
														classNamePrefix="react-select"
														styles={reactSelectStyles}
													/>
												</div>
											</div>
										</div>
									</div>

									{formData.tipo === 'subcuenta' && (
										<div>
											<label
												htmlFor="parentId"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Cuenta Principal
											</label>
											<Select<AccountOption>
												id="parentId"
												name="parentId"
												value={
													formData.parentId
														? {
																value: formData.parentId,
																label:
																	parentAccounts.find(
																		account => account._id === formData.parentId
																	)?.name || '',
														  }
														: undefined
												}
												onChange={(
													selectedOption: SingleValue<AccountOption>
												) => {
													if (selectedOption) {
														handleChange({
															target: {
																name: 'parentId',
																value: selectedOption.value,
															},
														} as any);
													} else {
														handleChange({
															target: {
																name: 'parentId',
																value: '',
															},
														} as any);
													}
												}}
												options={parentAccounts.map(account => ({
													value: account._id,
													label: account.name,
												}))}
												placeholder="Seleccionar cuenta principal"
												isClearable
												className="react-select-container"
												classNamePrefix="react-select"
												styles={reactSelectStyles}
											/>
										</div>
									)}
								</div>

								{/* Subaccounts Section */}
								{formData.tipo === 'principal' && (
									<div className="border-t border-gray-200 pt-6">
										<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
											<Users className="h-5 w-5 text-brand-light" />
											Gestión de Subcuentas
										</h3>

										<div className="space-y-4">
											{/* Current Subaccounts */}
											<div className="bg-gray-50 rounded-lg p-4">
												<h4 className="text-sm font-medium text-gray-700 mb-3">
													Subcuentas Asignadas
												</h4>
												<div className="space-y-2">
													{formData.subaccounts?.map(subaccount => (
														<div
															key={subaccount._id}
															className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm"
														>
															<span className="text-gray-700">
																{subaccount.name}
															</span>
															<button
																type="button"
																onClick={() =>
																	handleRemoveSubaccount(subaccount._id)
																}
																className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
															>
																<Trash2 className="h-4 w-4" />
															</button>
														</div>
													))}
													{(!formData.subaccounts ||
														formData.subaccounts.length === 0) && (
														<p className="text-sm text-gray-500 italic">
															No hay subcuentas asignadas
														</p>
													)}
												</div>
											</div>

											{/* Add New Subaccount */}
											<div className="flex gap-2">
												<div className={selectWrapperStyles}>
													<select
														value={selectedSubaccount}
														onChange={e =>
															setSelectedSubaccount(e.target.value)
														}
														className={selectStyles}
													>
														<option value="">Seleccionar subcuenta</option>
														{availableSubaccounts.map(subaccount => (
															<option
																key={subaccount._id}
																value={subaccount._id}
															>
																{subaccount.name}
															</option>
														))}
													</select>
													<div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
														<ChevronDown className="h-4 w-4 text-brand-light" />
													</div>
												</div>
												<button
													type="button"
													onClick={handleAddSubaccount}
													disabled={!selectedSubaccount}
													className="px-3 py-2 bg-brand-light text-white rounded-md hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
												>
													<Plus className="h-4 w-4" />
													Agregar
												</button>
											</div>
										</div>
									</div>
								)}

								{/* Artists Section */}
								<div className="border-t border-gray-200 pt-6">
									<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
										<Users className="h-5 w-5 text-brand-light" />
										Artistas Asignados
									</h3>

									{loadingAsignaciones ? (
										<div className="flex justify-center py-4">
											<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-dark"></div>
										</div>
									) : (
										<div className="space-y-6">
											{/* Current Artists */}
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{asignaciones
													.filter(a => !removedAsignaciones.includes(a._id))
													.map(asignacion => (
														<div
															key={asignacion._id}
															className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
														>
															<div className="flex items-center gap-3">
																{asignacion.artista_id.picture ? (
																	<img
																		src={asignacion.artista_id.picture}
																		alt={asignacion.artista_id.name}
																		className="w-10 h-10 rounded-full object-cover"
																	/>
																) : (
																	<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
																		<Users className="h-5 w-5 text-gray-400" />
																	</div>
																)}
																<div>
																	<p className="font-medium text-gray-900">
																		{asignacion.artista_id.name}
																	</p>
																	<p className="text-sm text-gray-500">
																		{asignacion.tipo_contrato === 'exclusivo'
																			? 'Contrato Exclusivo'
																			: 'Contrato No Exclusivo'}
																	</p>
																</div>
															</div>
															<div className="flex items-center gap-2">
																<span className="text-sm text-gray-500">
																	{asignacion.porcentaje_distribucion}%
																</span>
																<button
																	type="button"
																	onClick={() =>
																		handleRemoveArtist(asignacion._id)
																	}
																	className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
																>
																	<Trash2 className="h-4 w-4" />
																</button>
															</div>
														</div>
													))}

												{/* New Assignments */}
												{newAsignaciones.map(asignacion => (
													<div
														key={asignacion._id}
														className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-brand-light"
													>
														<div className="flex items-center gap-3">
															<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
																<Users className="h-5 w-5 text-gray-400" />
															</div>
															<div>
																<p className="font-medium text-gray-900">
																	{asignacion.artista_id.name}
																</p>
																<p className="text-sm text-gray-500">
																	{asignacion.tipo_contrato === 'exclusivo'
																		? 'Contrato Exclusivo'
																		: 'Contrato No Exclusivo'}
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<span className="text-sm text-gray-500">
																{asignacion.porcentaje_distribucion}%
															</span>
															<button
																type="button"
																onClick={() =>
																	handleRemoveArtist(asignacion._id)
																}
																className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
															>
																<Trash2 className="h-4 w-4" />
															</button>
														</div>
													</div>
												))}
											</div>

											{/* Add New Artist Form */}
											<div className="bg-gray-50 rounded-lg p-4">
												<h4 className="text-sm font-medium text-gray-700 mb-4">
													Asignar Nuevo Artista
												</h4>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Artista
														</label>
														<div className="flex items-center gap-2">
															<User className="h-4 w-4 text-gray-400" />
															<div className="flex-1">
																<Select<AccountOption>
																	value={
																		newAsignacion.artista_id
																			? {
																					value: newAsignacion.artista_id,
																					label:
																						availableArtists.find(
																							artist =>
																								artist._id ===
																								newAsignacion.artista_id
																						)?.name || '',
																			  }
																			: null
																	}
																	onChange={(
																		selectedOption: SingleValue<AccountOption>
																	) => {
																		if (selectedOption) {
																			setNewAsignacion(prev => ({
																				...prev,
																				artista_id: selectedOption.value,
																			}));
																		} else {
																			setNewAsignacion(prev => ({
																				...prev,
																				artista_id: '',
																			}));
																		}
																	}}
																	options={availableArtists.map(artist => ({
																		value: artist._id,
																		label: artist.name,
																	}))}
																	placeholder="Seleccionar artista"
																	isClearable
																	className="react-select-container"
																	classNamePrefix="react-select"
																	styles={reactSelectStyles}
																/>
															</div>
														</div>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Tipo de Contrato
														</label>
														<div className="flex items-center gap-2">
															<FileText className="h-4 w-4 text-gray-400" />
															<div className="flex-1">
																<Select<AccountOption>
																	value={{
																		value: newAsignacion.tipo_contrato,
																		label:
																			newAsignacion.tipo_contrato ===
																			'exclusivo'
																				? 'Exclusivo'
																				: 'No Exclusivo',
																	}}
																	onChange={(
																		selectedOption: SingleValue<AccountOption>
																	) => {
																		if (selectedOption) {
																			setNewAsignacion(prev => ({
																				...prev,
																				tipo_contrato: selectedOption.value as
																					| 'exclusivo'
																					| 'no_exclusivo',
																			}));
																		}
																	}}
																	options={[
																		{ value: 'exclusivo', label: 'Exclusivo' },
																		{
																			value: 'no_exclusivo',
																			label: 'No Exclusivo',
																		},
																	]}
																	className="react-select-container"
																	classNamePrefix="react-select"
																	styles={reactSelectStyles}
																/>
															</div>
														</div>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Fecha de Inicio
														</label>
														<input
															type="date"
															value={newAsignacion.fecha_inicio}
															onChange={e =>
																setNewAsignacion(prev => ({
																	...prev,
																	fecha_inicio: e.target.value,
																}))
															}
															className={inputStyles}
														/>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Fecha de Fin
														</label>
														<input
															type="date"
															value={newAsignacion.fecha_fin}
															onChange={e =>
																setNewAsignacion(prev => ({
																	...prev,
																	fecha_fin: e.target.value,
																}))
															}
															className={inputStyles}
														/>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Porcentaje de Distribución
														</label>
														<div className="flex items-center gap-2">
															<Percent className="h-4 w-4 text-gray-400" />
															<div className="flex-1">
																<input
																	type="number"
																	value={newAsignacion.porcentaje_distribucion}
																	onChange={e =>
																		setNewAsignacion(prev => ({
																			...prev,
																			porcentaje_distribucion: parseInt(
																				e.target.value
																			),
																		}))
																	}
																	min="0"
																	max="100"
																	className={inputStyles}
																/>
															</div>
														</div>
													</div>
												</div>
												<div className="mt-4 flex justify-end">
													<button
														type="button"
														onClick={handleAsignarArtista}
														className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-brand-light hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
													>
														<UserPlus className="h-4 w-4 mr-2" />
														Asignar Artista
													</button>
												</div>
											</div>
										</div>
									)}
								</div>

								{/* Extended Limit Section */}
								<div className="border-t border-gray-200 pt-6">
									<h4 className="text-lg font-medium text-gray-900 mb-4">
										Límite de Artistas
									</h4>

									{currentLimit ? (
										<div className="bg-green-50 p-4 rounded-md mb-4">
											<p className="text-green-700">
												Límite actual: {currentLimit.extendedLimit} artistas
											</p>
											<p className="text-sm text-green-600">
												Válido hasta:{' '}
												{new Date(currentLimit.endDate).toLocaleDateString()}
											</p>
										</div>
									) : (
										<div className="bg-yellow-50 p-4 rounded-md mb-4">
											<p className="text-yellow-700">
												Límite actual: 3 artistas (estándar)
											</p>
										</div>
									)}

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Nuevo Límite
											</label>
											<div className="flex items-center gap-2">
												<Users className="h-4 w-4 text-gray-400" />
												<div className="flex-1">
													<input
														type="number"
														min="3"
														value={extendedLimit.limit}
														onChange={e =>
															setExtendedLimit(prev => ({
																...prev,
																limit: parseInt(e.target.value),
															}))
														}
														className={inputStyles}
													/>
												</div>
											</div>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Fecha de Expiración
											</label>
											<input
												type="date"
												value={extendedLimit.endDate}
												onChange={e =>
													setExtendedLimit(prev => ({
														...prev,
														endDate: e.target.value,
													}))
												}
												className={inputStyles}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Monto del Pago
											</label>
											<div className="flex items-center gap-2">
												<DollarSign className="h-4 w-4 text-gray-400" />
												<div className="flex-1">
													<input
														type="number"
														min="0"
														value={extendedLimit.paymentDetails.amount}
														onChange={e =>
															setExtendedLimit(prev => ({
																...prev,
																paymentDetails: {
																	...prev.paymentDetails,
																	amount: parseFloat(e.target.value),
																},
															}))
														}
														className={inputStyles}
													/>
												</div>
											</div>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												ID de Transacción
											</label>
											<div className="flex items-center gap-2">
												<Hash className="h-4 w-4 text-gray-400" />
												<div className="flex-1">
													<input
														type="text"
														value={extendedLimit.paymentDetails.transactionId}
														onChange={e =>
															setExtendedLimit(prev => ({
																...prev,
																paymentDetails: {
																	...prev.paymentDetails,
																	transactionId: e.target.value,
																},
															}))
														}
														className={inputStyles}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
									<button
										type="button"
										onClick={onClose}
										className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
										<span className="group-hover:text-brand-dark">
											Cancelar
										</span>
									</button>
									<button
										type="submit"
										disabled={isSubmitting}
										className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isSubmitting ? (
											<>
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
												<span>Actualizando...</span>
											</>
										) : (
											<>
												<Save className="h-4 w-4 group-hover:text-brand-dark" />
												<span className="group-hover:text-brand-dark">
													Actualizar
												</span>
											</>
										)}
									</button>
								</div>
							</form>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default UpdateSelloModal;
