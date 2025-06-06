'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
	Building,
	Calendar,
	DollarSign,
	FileText,
	Hash,
	ImageIcon,
	Lock,
	Mail,
	Music,
	Percent,
	Save,
	Trash2,
	Upload,
	User,
	UserPlus,
	UserRoundCheck,
	Users,
	Camera,
} from 'lucide-react';
import { Sello } from '@/types/sello';
import { useRouter } from 'next/navigation';
import Select, { SingleValue } from 'react-select';

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

interface ArtistOption extends BaseOption {
	value: string;
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

const SelloProfile = () => {
	const { userData, error: settingsError, isLoading } = useSettings();
	const [formData, setFormData] = useState<SelloFormData>(() => {
		// Valores por defecto seguros
		const defaultValues = {
			_id: '',
			name: '',
			email: '',
			password: '',
			role: 'sello',
			picture: undefined,
			catalog_num: 0,
			year: new Date().getFullYear(),
			status: 'activo' as const,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			exclusivity: 'no_exclusivo' as const,
			primary_genre: '',
		};

		// Si no hay userData, retornar valores por defecto
		if (!userData) {
			return defaultValues;
		}

		// Si hay userData, mezclar con valores por defecto
		return {
			_id: userData._id || defaultValues._id,
			name: userData.name || defaultValues.name,
			email: userData.email || defaultValues.email,
			password: userData.password || defaultValues.password,
			role: userData.role || defaultValues.role,
			picture: userData.picture || defaultValues.picture,
			catalog_num: userData.catalog_num || defaultValues.catalog_num,
			year: userData.year || defaultValues.year,
			status:
				(userData.status === 'pendiente' ? 'activo' : userData.status) ||
				defaultValues.status,
			createdAt:
				userData.createdAt instanceof Date
					? userData.createdAt.toISOString()
					: userData.createdAt || defaultValues.createdAt,
			updatedAt:
				userData.updatedAt instanceof Date
					? userData.updatedAt.toISOString()
					: userData.updatedAt || defaultValues.updatedAt,
			exclusivity:
				(userData.exclusivity as 'exclusivo' | 'no_exclusivo') ||
				defaultValues.exclusivity,
			primary_genre: userData.primary_genre || defaultValues.primary_genre,
		};
	});

	useEffect(() => {
		if (userData) {
			setFormData(prev => ({
				...prev,
				_id: userData._id || prev._id,
				name: userData.name || prev.name,
				email: userData.email || prev.email,
				password: userData.password || prev.password,
				role: userData.role || prev.role,
				picture: userData.picture || prev.picture,
				catalog_num: userData.catalog_num || prev.catalog_num,
				year: userData.year || prev.year,
				status:
					(userData.status === 'pendiente' ? 'activo' : userData.status) ||
					prev.status,
				createdAt:
					userData.createdAt instanceof Date
						? userData.createdAt.toISOString()
						: userData.createdAt || prev.createdAt,
				updatedAt:
					userData.updatedAt instanceof Date
						? userData.updatedAt.toISOString()
						: userData.updatedAt || prev.updatedAt,
				exclusivity:
					(userData.exclusivity as 'exclusivo' | 'no_exclusivo') ||
					prev.exclusivity,
				primary_genre: userData.primary_genre || prev.primary_genre,
			}));
		}
		console.log('formData', userData);
	}, [userData]);

	const [asignaciones, setAsignaciones] = useState<Array<any>>([]);
	const [currentLimit, setCurrentLimit] = useState<any>(null);
	const [extendedLimit, setExtendedLimit] = useState({
		limit: 3,
		endDate: '',
		paymentDetails: {
			amount: 0,
			transactionId: '',
		},
	});
	const [isDeleting, setIsDeleting] = useState<string | null>(null);

	const [removedAsignaciones, setRemovedAsignaciones] = useState<Array<string>>(
		[]
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newAsignaciones, setNewAsignaciones] = useState<Array<any>>([]);
	const [newAsignacion, setNewAsignacion] = useState({
		artista_id: '',
		fecha_inicio: '',
		fecha_fin: '',
		tipo_contrato: 'exclusivo' as 'exclusivo' | 'no_exclusivo',
		porcentaje_distribucion: 80,
	});
	const [existingRelationships, setExistingRelationships] = useState<any[]>([]);
	const [availableArtists, setAvailableArtists] = useState<
		Array<{ _id: string; name: string }>
	>([]);
	const [selectedSubAccounts, setSelectedSubAccounts] = useState<User[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [loadingAsignaciones, setLoadingAsignaciones] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(() => {
		if (!formData.picture) return null;
		return formData.picture as string;
	});
	const [genres, setGenres] = useState<Array<{ _id: string; name: string }>>(
		[]
	);

	// Agregar este useEffect para actualizar imagePreview cuando userData cambie
	useEffect(() => {
		if (userData?.picture) {
			setImagePreview(userData.picture as string);
		}
	}, [userData]);
	useEffect(() => {
		const fetchGenres = async () => {
			try {
				const response = await fetch('/api/admin/getAllGenres');
				if (response.ok) {
					const data = await response.json();
					setGenres(data.data || []);

					// Asegurarnos de que el género se establezca correctamente
					if (userData.primary_genre) {
						setFormData(prev => ({
							...prev,
							primary_genre: userData.primary_genre || '',
						}));
					}
				}
			} catch (error) {
				console.error('Error fetching genres:', error);
			}
		};

		fetchGenres();
	}, [formData.primary_genre]);
	const getImageSource = (picture: string | null | undefined) => {
		if (!picture) return null;

		// Si es una URL (comienza con http:// o https://)
		if (picture.startsWith('http://') || picture.startsWith('https://')) {
			return picture;
		}

		if (picture.startsWith('data:image')) {
			return picture;
		}

		// Si es un string base64 sin el prefijo
		return `data:image/jpeg;base64,${picture}`;
	};
	// Generate years array from 1900 to current year
	const currentYear = new Date().getFullYear();
	const years = Array.from(
		{ length: currentYear - 1899 },
		(_, i) => currentYear - i
	).map(year => ({
		value: year.toString(),
		label: year.toString(),
	}));
	const fileInputRef = useRef<HTMLInputElement>(null);
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
					mainAccountId: userData._id,
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
	const handleSubAccountsChange = (selectedOptions: any) => {
		setSelectedSubAccounts(selectedOptions || []);
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
			const formDataToSend = new FormData();
			formDataToSend.append('name', formData.name);
			formDataToSend.append('email', formData.email);
			formDataToSend.append('role', 'sello');
			formDataToSend.append('_id', formData._id);
			formDataToSend.append('external_id', userData.external_id.toString());

			if (formData.password) {
				formDataToSend.append('password', formData.password);
			}

			formDataToSend.append('status', formData.status || 'activo');
			formDataToSend.append('catalog_num', formData.catalog_num.toString());
			formDataToSend.append('year', formData.year.toString());
			formDataToSend.append('exclusivity', formData.exclusivity);
			formDataToSend.append('primary_genre', formData.primary_genre);

			if (formData.picture instanceof File) {
				formDataToSend.append('picture', formData.picture);
			} else if (typeof formData.picture === 'string') {
				formDataToSend.append('picture', formData.picture);
			}

			// Agregar datos de relaciones con información adicional
			if (selectedSubAccounts.length > 0) {
				const subAccountsData = selectedSubAccounts.map(account => ({
					subAccountId: account._id,
					status: 'activo', // Estado por defecto de la relación
					role: account.role, // Incluimos el rol para referencia
				}));
				formDataToSend.append('subAccounts', JSON.stringify(subAccountsData));
			}
		} catch (error) {
			console.error('Error saving sello:', error);
		} finally {
			console.log('finally');
		}
	};
	const inputStyles =
		'w-full pl-10 pr-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';
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
	const artistSelectStyles = {
		...baseSelectStyles,
	};
	const yearSelectStyles = {
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
	const statusOptions: StatusOption[] = [
		{ value: 'activo', label: 'Activo' },
		{ value: 'inactivo', label: 'Inactivo' },
		{ value: 'banneado', label: 'Baneado' },
	];
	if (isLoading) {
		return <div>Loading...</div>;
	}
	if (settingsError) {
		return <div>Error: {settingsError}</div>;
	}
	if (!userData) {
		return <div>No user data available</div>;
	}
	return (
		<AnimatePresence>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				transition={{ type: 'spring', damping: 25, stiffness: 300 }}
				className="bg-white mx-auto w-full max-w-[70%]"
				onClick={e => e.stopPropagation()}
			>
				{/* Main Content */}
				<div className="p-6">
					<form onSubmit={handleSubmit} className="space-y-8">
						{/* Logo Section */}
						<div className="space-y-4">
							<label className="block text-md text-center font-bold text-gray-700">
								Logo del Sello
							</label>
							<div className="flex flex-col space-y-4">
								<div className="flex flex-col items-center space-y-4">
									<div className="mx-auto  relative w-36 h-36">
										<div className="w-full h-full border-2 rounded-full flex shadow-lg items-center justify-center overflow-hidden">
											{imagePreview ? (
												<img
													src={imagePreview}
													alt="Preview"
													className="w-full h-full object-cover"
												/>
											) : (
												<User className="w-16 h-16 text-gray-400" />
											)}
										</div>
										<button
											type="button"
											onClick={() => fileInputRef.current?.click()}
											className="absolute bottom-0 right-0 bg-brand-dark text-white p-2 rounded-full shadow-lg hover:bg-brand-light transition-colors"
										>
											<Camera className="w-5 h-5" />
										</button>
										<input
											type="file"
											ref={fileInputRef}
											className="hidden"
											accept="image/*"
											onChange={handleImageChange}
										/>
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
												onChange={(selectedOption: SingleValue<YearOption>) => {
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
									<p className="block text-sm font-medium text-gray-700 mb-1">
										Estado: <span className="font-bold">{formData.status}</span>
									</p>
								</div>
							</div>
						</div>

						{/* Extended Limit Section */}
						{/* <div className="border-t border-gray-200 pt-6">
							<h4 className="text-lg text-center font-medium text-gray-900 mb-4">
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
									<Users className="h-4 w-4 text-gray-400" />
									<p className="block text-sm font-medium text-gray-700 mb-1">
										Límite:{' '}
										<span className="font-bold">{extendedLimit.limit}</span>
									</p>
								</div>

								<div>
									<p className="block text-sm font-medium text-gray-700 mb-1">
										Fecha de Expiración{' '}
										<span className="font-bold">{extendedLimit.endDate}</span>
									</p>
								</div>
							</div>
						</div> */}

						{/* Action Buttons */}
						<div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
		</AnimatePresence>
	);
};

export default SelloProfile;
