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
	UserRoundCheck,
	FileText,
	Percent,
	DollarSign,
	Music,
	AlertTriangle,
} from 'lucide-react';
import { Sello } from '@/types/sello';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Select, { SingleValue } from 'react-select';
import { StylesConfig } from 'react-select';

interface UpdateSelloModalProps {
	sello: Sello;
	isOpen: boolean;
	onClose: () => void;
	onSave: (formData: FormData) => Promise<void>;
}

interface BaseOption {
	value: string;
	label: string;
}
interface Asignacion {
	artista_id: number;
	fecha_inicio: string;
	fecha_fin: string;
	tipo_contrato: 'exclusivo' | 'no_exclusivo';
	porcentaje_distribucion: number;
}
interface AccountOption extends BaseOption {
	value: 'principal' | 'subcuenta';
}

interface StatusOption extends BaseOption {
	value: 'activo' | 'inactivo' | 'banneado';
}

interface ExclusivityOption extends BaseOption {
	value: 'exclusivo' | 'no_exclusivo';
}

interface YearOption extends BaseOption {
	value: string;
}

interface ArtistOption {
	value: number;
	label: string;
}

interface GenreOption extends BaseOption {
	value: string;
	label: string;
}

interface SelloFormData {
	_id: string;
	name: string;
	email: string;
	password: string;
	role: string;
	picture?: string | File;
	catalog_num: number;
	year: number;
	status: 'activo' | 'inactivo' | 'banneado';
	createdAt: string;
	updatedAt: string;
	exclusivity: 'exclusivo' | 'no_exclusivo';
	primary_genre: string;
}

interface User {
	_id: string;
	name: string;
	email: string;
	role: string;
}

const UpdateSelloModal: React.FC<UpdateSelloModalProps> = ({
	sello,
	isOpen,
	onClose,
	onSave,
}) => {
	const router = useRouter();
	// Estados para la gestión de cuentas
	const [users, setUsers] = useState<User[]>([]);
	const [isLoadingUsers, setIsLoadingUsers] = useState(false);
	const [selectedSubAccounts, setSelectedSubAccounts] = useState<User[]>([]);
	const [existingRelationships, setExistingRelationships] = useState<any[]>([]);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [asignaciones, setAsignaciones] = useState<Array<any>>([]);
	const [loadingAsignaciones, setLoadingAsignaciones] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [availableArtists, setAvailableArtists] = useState<
		Array<{ _id: string; external_id: number; name: string }>
	>([]);
	const [newAsignaciones, setNewAsignaciones] = useState<Array<any>>([]);
	const [removedAsignaciones, setRemovedAsignaciones] = useState<Array<string>>(
		[]
	);
	const [newAsignacion, setNewAsignacion] = useState<Asignacion>({
		artista_id: 0,
		fecha_inicio: '',
		fecha_fin: '',
		tipo_contrato: 'exclusivo',
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
	const [genres, setGenres] = useState<Array<{ _id: string; name: string }>>(
		[]
	);

	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState<SelloFormData>(() => {
		return {
			_id: sello._id,
			name: sello.name,
			email: sello.email || '',
			password: sello.password || '',
			role: sello.role,
			picture: sello.picture,
			catalog_num: sello.catalog_num || 0,
			year: sello.year || new Date().getFullYear(),
			status:
				(sello.status === 'pendiente' ? 'activo' : sello.status) || 'activo',
			createdAt:
				sello.createdAt instanceof Date
					? sello.createdAt.toISOString()
					: sello.createdAt || new Date().toISOString(),
			updatedAt:
				sello.updatedAt instanceof Date
					? sello.updatedAt.toISOString()
					: sello.updatedAt || new Date().toISOString(),
			exclusivity:
				(sello.exclusivity as 'exclusivo' | 'no_exclusivo') || 'no_exclusivo',
			primary_genre: sello.primary_genre || '',
		};
	});

	const [imagePreview, setImagePreview] = useState<string | null>(() => {
		if (!sello.picture) return null;
		return typeof sello.picture === 'string' ? sello.picture : null;
	});
	const [uploadProgress, setUploadProgress] = useState<{
		total: number;
		loaded: number;
		percentage: number;
		totalChunks: number;
		filesCompleted: number;
	} | null>(null);

	// Funciones para la gestión de cuentas
	const fetchUsers = async () => {
		try {
			setIsLoadingUsers(true);
			const response = await fetch('/api/admin/getAllUsers?all=true');
			if (!response.ok) {
				throw new Error('Error al obtener usuarios');
			}
			const data = await response.json();
			setUsers(data.data.users);
		} catch (error) {
			console.error('Error fetching users:', error);
			toast.error('Error al cargar los usuarios');
		} finally {
			setIsLoadingUsers(false);
		}
	};

	const fetchExistingRelationships = async () => {
		try {
			const response = await fetch(`/api/admin/getUserRelations/${sello._id}`);
			if (!response.ok) throw new Error('Error al obtener relaciones');
			const data = await response.json();
			setExistingRelationships(data.data.subAccounts || []);
		} catch (error) {
			console.error('Error al obtener relaciones:', error);
		}
	};

	const handleDeleteRelationship = async (relationshipId: string) => {
		try {
			setIsDeleting(relationshipId);
			const response = await fetch('/api/admin/accountRelationships', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					mainAccountId: sello._id,
					subAccountId: relationshipId,
				}),
			});

			if (!response.ok) {
				throw new Error('Error al eliminar la relación');
			}

			setExistingRelationships(prev =>
				prev.filter(rel => rel._id !== relationshipId)
			);
			toast.success('Relación eliminada exitosamente');
		} catch (error) {
			console.error('Error al eliminar la relación:', error);
			toast.error('Error al eliminar la relación');
		} finally {
			setIsDeleting(null);
		}
	};

	// Cargar usuarios y relaciones al abrir el modal
	useEffect(() => {
		if (isOpen) {
			fetchUsers();
			fetchExistingRelationships();
		}
	}, [isOpen]);

	// Generate years array from 1900 to current year
	const currentYear = new Date().getFullYear();
	const years = Array.from(
		{ length: currentYear - 1899 },
		(_, i) => currentYear - i
	).map(year => ({
		value: year.toString(),
		label: year.toString(),
	}));

	const statusOptions: StatusOption[] = [
		{ value: 'activo', label: 'Activo' },
		{ value: 'inactivo', label: 'Inactivo' },
		{ value: 'banneado', label: 'Baneado' },
	];

	const baseSelectStyles = {
		control: (base: any, state: any) => ({
			...base,
			backgroundColor: 'transparent',
			border: 'none',
			borderBottom: '2px solid #E5E7EB',
			borderRadius: '0',
			boxShadow: 'none',
			minHeight: '38px',
			'&:hover': {
				borderBottom: '2px solid #4B5563',
			},
			'&:focus-within': {
				borderBottom: '2px solid #4B5563',
				boxShadow: 'none',
			},
		}),
		option: (base: any, state: any) => ({
			...base,
			backgroundColor: state.isSelected
				? '#4B5563'
				: state.isFocused
				? '#F3F4F6'
				: 'white',
			color: state.isSelected ? 'white' : '#1F2937',
			cursor: 'pointer',
			'&:hover': {
				backgroundColor: state.isSelected ? '#4B5563' : '#F3F4F6',
			},
		}),
		menu: (base: any) => ({
			...base,
			zIndex: 9999,
			backgroundColor: 'white',
			borderRadius: '0.375rem',
			boxShadow:
				'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
		}),
		menuList: (base: any) => ({
			...base,
			padding: '0.5rem 0',
		}),
		indicatorSeparator: () => ({
			display: 'none',
		}),
		dropdownIndicator: (base: any) => ({
			...base,
			color: '#9CA3AF',
			'&:hover': {
				color: '#4B5563',
			},
		}),
		clearIndicator: (base: any) => ({
			...base,
			color: '#9CA3AF',
			'&:hover': {
				color: '#4B5563',
			},
		}),
		valueContainer: (base: any) => ({
			...base,
			padding: '0 0.5rem',
		}),
		input: (base: any) => ({
			...base,
			margin: 0,
			padding: 0,
		}),
		placeholder: (base: any) => ({
			...base,
			color: '#9CA3AF',
		}),
		singleValue: (base: any) => ({
			...base,
			color: '#1F2937',
		}),
	};

	const yearSelectStyles = {
		...baseSelectStyles,
	};

	const artistSelectStyles = {
		...baseSelectStyles,
	};

	const genreSelectStyles = {
		...baseSelectStyles,
	};

	const statusSelectStyles = {
		...baseSelectStyles,
	};

	const exclusivitySelectStyles = {
		...baseSelectStyles,
	};

	// Update the input styles to accommodate icons
	const inputStyles =
		'w-full pl-10 pr-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

	// Actualizar la previsualización cuando cambia el sello seleccionado
	useEffect(() => {
		if (!sello.picture) {
			setImagePreview(null);
			return;
		}
		setImagePreview(typeof sello.picture === 'string' ? sello.picture : null);
	}, [sello]);

	// Cargar asignaciones cuando se abre el modal
	useEffect(() => {
		const fetchAsignaciones = async () => {
			if (isOpen && sello._id) {
				setLoadingAsignaciones(true);
				try {
					const response = await fetch(
						`/api/admin/getAllAsignaciones/${sello._id}`
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
		fetchCurrentLimit();
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
							external_id: user.external_id,
							name: user.name,
						}));
					setAvailableArtists(artists);
				}
			} catch (error) {
				console.error('Error fetching artists:', error);
			}
		};

		if (isOpen) {
			fetchArtists();
		}
	}, [isOpen]);

	// Cargar géneros disponibles
	useEffect(() => {
		const fetchGenres = async () => {
			try {
				const response = await fetch('/api/admin/getAllGenres');
				if (response.ok) {
					const data = await response.json();
					setGenres(data.data || []);

					// Asegurarnos de que el género se establezca correctamente
					if (sello.primary_genre) {
						setFormData(prev => ({
							...prev,
							primary_genre: sello.primary_genre || '',
						}));
					}
				}
			} catch (error) {
				console.error('Error fetching genres:', error);
			}
		};

		if (isOpen) {
			fetchGenres();
		}
	}, [isOpen, sello.primary_genre]);

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

	const handleAsignarArtista = () => {
		if (!newAsignacion.artista_id) {
			alert('Por favor selecciona un artista');
			return;
		}

		if (!newAsignacion.fecha_inicio) {
			alert('Por favor selecciona una fecha de inicio');
			return;
		}

		// Encontrar el artista seleccionado para mostrar su nombre
		const artistaSeleccionado = availableArtists.find(
			a => a.external_id === Number(newAsignacion.artista_id)
		);
		if (!artistaSeleccionado) return;

		// Agregar la nueva asignación a la lista temporal
		setNewAsignaciones(prev => [
			...prev,
			{
				...newAsignacion,
				_id: `new_${artistaSeleccionado.external_id}`, // ID temporal único
				artista_id: {
					external_id: Number(artistaSeleccionado.external_id),
					name: artistaSeleccionado.name,
				},
			},
		]);

		// Limpiar el formulario
		setNewAsignacion({
			artista_id: 0,
			fecha_inicio: '',
			fecha_fin: '',
			tipo_contrato: 'exclusivo',
			porcentaje_distribucion: 80,
		});

		setShowSuccessMessage(true);
		setTimeout(() => setShowSuccessMessage(false), 3000);
	};

	const handleRemoveArtist = (id: string) => {
		// Si el ID comienza con "new_", es una nueva asignación
		if (id.startsWith('new_')) {
			setNewAsignaciones(prev => prev.filter(asig => asig._id !== id));
		} else {
			// Es una asignación existente, agregarla a removedAsignaciones
			const asignacion = asignaciones.find(a => a._id === id);
			if (asignacion) {
				setRemovedAsignaciones(prev => [...prev, asignacion._id]);
			}
		}
	};

	const handleSubAccountsChange = (selectedOptions: any) => {
		setSelectedSubAccounts(selectedOptions || []);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setIsSubmitting(true);
		setError(null);
		const formDataToSend = new FormData();
		try {
			let data = {
				name: formData.name,
				email: formData.email,
				role: 'sello',
				_id: formData._id,
				picture: '',
				external_id: sello.external_id.toString(),
				asignaciones: newAsignaciones,
				removedAsignaciones: removedAsignaciones,
				password: formData.password.length > 0 ? formData.password : null,
				status: formData.status || 'activo',
				catalog_num: formData.catalog_num.toString(),
				year: formData.year.toString(),
				exclusivity: formData.exclusivity,
				primary_genre: formData.primary_genre,
				subAccounts:
					selectedSubAccounts.length > 0
						? selectedSubAccounts.map(account => ({
								subAccountId: account._id,
								status: 'activo',
								role: account.role,
						  }))
						: undefined,
			};

			if (formData.picture instanceof File) {
				formDataToSend.append('picture', formData.picture);
			} else if (typeof formData.picture === 'string') {
				formDataToSend.append('picture', formData.picture);
			}
			formDataToSend.append('data', JSON.stringify(data));

			await onSave(formDataToSend);
			onClose();
		} catch (error) {
			console.error('Error saving sello:', error);
			setError(
				error instanceof Error ? error.message : 'Error al guardar el sello'
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const fetchCurrentLimit = async () => {
		try {
			const response = await fetch(
				`/api/admin/sello-limits?sello_id=${sello._id}`
			);
			const data = await response.json();
			if (data.success && data.data.length > 0) {
				const activeLimit = data.data.find(
					(limit: any) => limit.status === 'activo'
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
									<div className="flex flex-col md:flex-row items-center gap-4">
										<div className="w-32 h-32 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative group">
											{imagePreview ? (
												<>
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
														className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
													>
														<Upload className="h-6 w-6 mb-1" />
														<span className="text-sm">Cambiar imagen</span>
													</button>
													<img
														src={imagePreview}
														alt="Preview"
														className="absolute w-full h-full object-cover"
													/>
												</>
											) : (
												<div className="text-center">
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
														className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
													>
														<Upload className="h-6 w-6 mb-1" />
														<span className="text-sm">Cambiar imagen</span>
													</button>
													<ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
													<span className="mt-1 block text-xs text-gray-500">
														Sin imagen
													</span>
												</div>
											)}
										</div>
										<div>
											<p className="text-xs text-gray-500">
												<strong>Formato:</strong> JPG
											</p>
											<p className="text-xs text-gray-500">
												<strong>Resolución:</strong> 3000 X 3000 px
											</p>
											<p className="text-xs text-gray-500">
												<strong>Peso máximo:</strong> 4MB
											</p>
											<p className="text-xs text-gray-500">
												<strong>Colores:</strong> RGB
											</p>
											<div className="bg-yellow-100 p-2 rounded-md">
												<div className="flex items-center gap-2">
													<AlertTriangle className="h-4 w-4 text-yellow-600" />
													<p className="text-[9px] md:text-xs text-yellow-800">
														No seguir estas indicaciones puede causar{' '}
														<strong>error</strong> en la subida
													</p>
												</div>
											</div>
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
												htmlFor="email"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Email
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
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

										<div>
											<label
												htmlFor="tipo"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Tipo de Cuenta
											</label>
											<div className="flex items-center gap-2">
												<Building className="h-5 w-5 text-gray-400" />
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
													placeholder="Dejar en blanco para mantener la contraseña actual"
													name="password"
													value={formData.password}
													onChange={handleChange}
													className={inputStyles}
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
													<Select<YearOption>
														value={
															formData.year
																? {
																		value: formData.year.toString(),
																		label: formData.year.toString(),
																  }
																: null
														}
														onChange={(
															selectedOption: SingleValue<YearOption>
														) => {
															if (selectedOption) {
																setFormData(prev => ({
																	...prev,
																	year: parseInt(selectedOption.value),
																}));
															}
														}}
														options={years}
														placeholder="Seleccionar año"
														isClearable
														className="react-select-container"
														classNamePrefix="react-select"
														styles={yearSelectStyles}
													/>
												</div>
											</div>
										</div>

										<div>
											<label
												htmlFor="primary_genre"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Género Principal
											</label>
											<div className="flex items-center gap-2">
												<Music className="h-4 w-4 text-gray-400" />
												<div className="flex-1">
													<Select<GenreOption>
														value={(() => {
															// Si tenemos un género en formData y géneros cargados
															if (formData.primary_genre && genres.length > 0) {
																// Buscar el género que coincida exactamente con el nombre
																const matchingGenre = genres.find(
																	g =>
																		g.name.toLowerCase() ===
																		formData.primary_genre.toLowerCase()
																);
																if (matchingGenre) {
																	return {
																		value: matchingGenre.name,
																		label: matchingGenre.name,
																	};
																}
															}
															return null;
														})()}
														onChange={(
															selectedOption: SingleValue<GenreOption>
														) => {
															if (selectedOption) {
																setFormData(prev => ({
																	...prev,
																	primary_genre: selectedOption.value,
																}));
															} else {
																setFormData(prev => ({
																	...prev,
																	primary_genre: '',
																}));
															}
														}}
														options={genres.map(genre => ({
															value: genre.name,
															label: genre.name,
														}))}
														placeholder="Seleccionar género"
														isClearable
														className="react-select-container"
														classNamePrefix="react-select"
														styles={genreSelectStyles}
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
												<UserRoundCheck className="h-5 w-5 text-gray-400" />
												<div className="flex-1">
													<Select<StatusOption>
														id="status"
														value={statusOptions.find(
															option => option.value === formData.status
														)}
														onChange={option => {
															if (option) {
																setFormData(prev => ({
																	...prev,
																	status: option.value,
																}));
															}
														}}
														options={statusOptions}
														placeholder="Seleccionar estado"
														styles={statusSelectStyles}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Artists Section */}
								<div className="border-t border-gray-200 pt-6">
									<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
										<Users className="h-5 w-5 text-brand-light" />
										Artistas Asignados
									</h3>
									<div>
										<p className="text-sm bg-yellow-100 text-center text-yellow-700 mb-4 py-2 rounded-lg flex items-center justify-center gap-2">
											<AlertTriangle className="h-4 w-4" />
											Si no presiona el botón <strong>Actualizar</strong>las
											asignaciones no tendrán efecto.
										</p>
									</div>
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

												{/* Message when no artists are assigned */}
												{asignaciones.filter(
													a => !removedAsignaciones.includes(a._id)
												).length === 0 &&
													newAsignaciones.length === 0 && (
														<div className="col-span-2 text-center py-8 bg-gray-50 rounded-lg">
															<Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
															<p className="text-gray-500">
																No hay artistas asignados
															</p>
														</div>
													)}
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
																<Select<ArtistOption>
																	value={
																		newAsignacion.artista_id
																			? {
																					value: Number(
																						newAsignacion.artista_id
																					),
																					label:
																						availableArtists.find(
																							artist =>
																								artist.external_id ===
																								Number(newAsignacion.artista_id)
																						)?.name || '',
																			  }
																			: null
																	}
																	onChange={(
																		selectedOption: SingleValue<ArtistOption>
																	) => {
																		if (selectedOption) {
																			setNewAsignacion(prev => ({
																				...prev,
																				artista_id: Number(
																					selectedOption.value
																				),
																			}));
																		} else {
																			setNewAsignacion(prev => ({
																				...prev,
																				artista_id: 0,
																			}));
																		}
																	}}
																	options={availableArtists.map(artist => ({
																		value: Number(artist.external_id),
																		label: artist.name,
																	}))}
																	placeholder="Seleccionar artista"
																	isClearable
																	className="react-select-container"
																	classNamePrefix="react-select"
																	styles={artistSelectStyles}
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
																<Select<ExclusivityOption>
																	value={{
																		value: newAsignacion.tipo_contrato,
																		label:
																			newAsignacion.tipo_contrato ===
																			'exclusivo'
																				? 'Exclusivo'
																				: 'No Exclusivo',
																	}}
																	onChange={(
																		selectedOption: SingleValue<ExclusivityOption>
																	) => {
																		if (selectedOption) {
																			setNewAsignacion(prev => ({
																				...prev,
																				tipo_contrato: selectedOption.value,
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
																	styles={exclusivitySelectStyles}
																/>
															</div>
														</div>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Fecha de Inicio
														</label>
														<div className="relative">
															<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Fecha de Fin
														</label>
														<div className="relative">
															<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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

								{/* Sección de Gestión de Cuentas */}
								<div className="space-y-4 mt-6">
									<h3 className="text-lg font-medium text-gray-900">
										Gestión de Cuentas
									</h3>

									{/* Subcuentas Existentes */}
									{existingRelationships.length > 0 ? (
										<div className="mt-4">
											<h4 className="font-medium text-gray-700 mb-2">
												Subcuentas Asociadas
											</h4>
											<div className="space-y-2">
												{existingRelationships.map(rel => (
													<div
														key={rel._id}
														className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
													>
														<div>
															<p className="text-sm text-gray-600">
																{rel.name}
															</p>
															<p className="text-xs text-gray-500">
																{rel.email}
															</p>
														</div>
														<div className="flex items-center space-x-2">
															<span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
																{rel.role}
															</span>
															<button
																onClick={() =>
																	handleDeleteRelationship(rel._id)
																}
																disabled={isDeleting === rel._id}
																className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
																title="Eliminar relación"
															>
																{isDeleting === rel._id ? (
																	<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
																) : (
																	<Trash2 size={16} />
																)}
															</button>
														</div>
													</div>
												))}
											</div>
										</div>
									) : (
										<div className="mt-4 text-center text-gray-500">
											No hay subcuentas asociadas
										</div>
									)}

									{/* Selector de Subcuentas */}
									<div className="mt-4">
										<h4 className="font-medium text-gray-700 mb-2">
											Agregar Subcuentas
										</h4>
										<Select
											isMulti
											options={users}
											value={selectedSubAccounts}
											onChange={handleSubAccountsChange}
											formatOptionLabel={(option: any) => (
												<div className="flex flex-col">
													<span className="font-medium">{option.name}</span>
													<span className="text-sm text-gray-500">
														{option.email}
													</span>
												</div>
											)}
											placeholder="Seleccionar subcuentas..."
											className="basic-multi-select"
											classNamePrefix="select"
											styles={{
												control: (base, state) => ({
													...base,
													border: 'none',
													borderBottom: '2px solid #E5E7EB',
													borderRadius: '0',
													boxShadow: 'none',
													backgroundColor: 'transparent',
													'&:hover': {
														borderBottom: '2px solid #4B5563',
													},
													'&:focus-within': {
														borderBottom: '2px solid #4B5563',
													},
													minHeight: '38px',
												}),
												option: (base, state) => ({
													...base,
													backgroundColor: state.isSelected
														? '#4B5563'
														: state.isFocused
														? '#E5E7EB'
														: 'white',
													color: state.isSelected ? 'white' : '#1F2937',
													'&:hover': {
														backgroundColor: state.isSelected
															? '#4B5563'
															: '#E5E7EB',
													},
													padding: '8px 12px',
												}),
												menu: base => ({
													...base,
													borderRadius: '0.375rem',
													boxShadow:
														'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
													width: '100%',
													marginTop: '4px',
												}),
												menuList: base => ({
													...base,
													padding: '4px 0',
												}),
												placeholder: base => ({
													...base,
													color: '#9CA3AF',
												}),
												multiValue: base => ({
													...base,
													backgroundColor: '#E5E7EB',
													borderRadius: '0.375rem',
												}),
												multiValueLabel: base => ({
													...base,
													color: '#1F2937',
													padding: '2px 6px',
												}),
												multiValueRemove: base => ({
													...base,
													color: '#6B7280',
													'&:hover': {
														backgroundColor: '#D1D5DB',
														color: '#1F2937',
													},
												}),
											}}
										/>
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
