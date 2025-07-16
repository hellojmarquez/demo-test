import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	X,
	Save,
	Image as ImageIcon,
	XCircle,
	Upload,
	Hash,
	AlertTriangle,
} from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';

interface CreateSelloModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (selloData: {
		name: string;
		email: string;
		password: string;
		primary_genre: string;
		year: number;
		catalog_num: number;
		picture?: File | null;
		isSubaccount?: boolean;
		parentUserId?: string;
	}) => Promise<void>;
}

interface GenreOption {
	value: string;
	label: string;
}

interface YearOption {
	value: string;
	label: string;
}

interface ParentOption {
	value: string;
	label: string;
}

interface SelloFormData {
	name: string;
	email: string;
	password: string;
	primary_genre: string;
	year: string;
	catalog_number: string;
	picture: { base64: string } | undefined;
	isSubaccount: boolean;
	parentUserId: string;
}

function CreateSelloModal({
	isOpen,
	onClose,
	onSave,
}: CreateSelloModalProps): JSX.Element {
	const [formData, setFormData] = useState<SelloFormData>({
		name: '',
		email: '',
		password: '',
		primary_genre: '',
		year: new Date().getFullYear().toString(),
		catalog_number: '',
		picture: undefined,
		isSubaccount: false,
		parentUserId: '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState('');
	const [availableParents, setAvailableParents] = useState<
		Array<{ _id: string; name: string; role: string }>
	>([]);
	const [genres, setGenres] = useState<Array<{ _id: string; name: string }>>(
		[]
	);
	const [nameError, setNameError] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [primaryGenreError, setPrimaryGenreError] = useState<string | null>(
		null
	);
	const [yearError, setYearError] = useState<string | null>(null);
	const [catalogNumberError, setCatalogNumberError] = useState<string | null>(
		null
	);
	const [uploadProgress, setUploadProgress] = useState<{
		total: number;
		loaded: number;
		percentage: number;
		totalChunks: number;
		filesCompleted: number;
	} | null>(null);
	const [imageErr, setimageErr] = useState<string | null>(null);
	const inputStyles =
		'w-full pl-10 pr-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

	const reactSelectStyles = {
		control: (base: any) => ({
			...base,
			border: 'none',
			borderBottom: '2px solid #E5E7EB',
			borderRadius: '0',
			boxShadow: 'none',
			backgroundColor: 'transparent',
			'&:hover': {
				borderBottom: '2px solid #4B5563',
			},
		}),
		option: (base: any, state: { isSelected: boolean }) => ({
			...base,
			backgroundColor: state.isSelected ? '#4B5563' : 'white',
			color: state.isSelected ? 'white' : '#1F2937',
			'&:hover': {
				backgroundColor: state.isSelected ? '#4B5563' : '#F3F4F6',
			},
		}),
		menu: (base: any) => ({
			...base,
			boxShadow: 'none',
			border: '1px solid #E5E7EB',
		}),
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch available parents
				const parentsResponse = await fetch('/api/admin/getAllUsers');
				if (parentsResponse.ok) {
					const data = await parentsResponse.json();
					setAvailableParents(data.users || []);
				}

				// Fetch genres
				const genresResponse = await fetch('/api/admin/getAllGenres');
				if (genresResponse.ok) {
					const genresData = await genresResponse.json();

					setGenres(genresData.data || []);
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};

		if (isOpen) {
			fetchData();
		}
	}, [isOpen]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target;

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData(prev => ({
				...prev,
				[name]: checked,
			}));
		} else if (name === 'year') {
			// Solo permitir números y máximo 4 dígitos
			if (/^\d{0,4}$/.test(value)) {
				setFormData(prev => ({
					...prev,
					[name]: value,
				}));
			}
		} else if (name === 'catalog_number') {
			// Solo permitir enteros positivos para el número de catálogo
			if (/^\d*$/.test(value)) {
				setFormData(prev => ({
					...prev,
					catalog_number: value,
				}));
			}
		} else {
			// Para otros campos
			setFormData(prev => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Crear URL para vista previa
			const previewUrl = URL.createObjectURL(file);
			setImagePreview(previewUrl);

			// Guardar el archivo directamente
			setFormData((prev: any) => ({
				...prev,
				picture: file, // Guardar como File, no como base64
			}));
		}
	};
	const createChunks = (file: File, chunkSize: number = 250 * 1024) => {
		const chunks = [];
		const totalChunks = Math.ceil(file.size / chunkSize);

		for (let i = 0; i < totalChunks; i++) {
			const start = i * chunkSize;
			const end = Math.min(start + chunkSize, file.size);
			chunks.push({
				chunk: file.slice(start, end),
				index: i,
				total: totalChunks,
			});
		}

		return chunks;
	};

	// Función para subir un chunk
	const uploadChunk = async (
		chunk: Blob,
		chunkIndex: number,
		totalChunks: number,
		trackData: any,
		fileName: string
	) => {
		const formData = new FormData();
		formData.append('chunk', chunk);
		formData.append('chunkIndex', chunkIndex.toString());
		formData.append('totalChunks', totalChunks.toString());

		formData.append('data', JSON.stringify(trackData));
		formData.append('fileName', fileName);

		const response = await fetch(`/api/admin/createSello`, {
			method: 'POST',
			body: formData,
		});
		if (response.ok) {
			setUploadProgress(prev => {
				if (!prev) return prev;
				const newLoaded = prev.loaded + 1;
				return {
					...prev,
					loaded: newLoaded,
					percentage: Math.floor((newLoaded / prev.totalChunks) * 100),
				};
			});
		}

		return response.json();
	};

	// Función para subir archivo completo por chunks
	const uploadFileByChunks = async (file: File, trackData: any) => {
		const chunks = createChunks(file);
		let lastResponse = null;

		for (let i = 0; i < chunks.length; i++) {
			const { chunk, index, total } = chunks[i];
			lastResponse = await uploadChunk(
				chunk,
				index,
				total,
				trackData,
				file.name
			);
		}

		return lastResponse;
	};
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setNameError(null);
		setEmailError(null);
		setPasswordError(null);
		setPrimaryGenreError(null);
		setYearError(null);
		setCatalogNumberError(null);
		setimageErr(null);
		setError('');
		let hasErrors = false;

		try {
			const dataToSend = {
				name: formData.name,
				email: formData.email,
				password: formData.password,
				primary_genre: formData.primary_genre,
				year: formData.year ? parseInt(formData.year) : '',
				catalog_num: formData.catalog_number
					? parseInt(formData.catalog_number)
					: '',
				isSubaccount: formData.isSubaccount,
				tipo: formData.isSubaccount ? 'subcuenta' : 'principal',
				// Agregar campos de parent si es subcuenta
				...(formData.isSubaccount &&
					formData.parentUserId && {
						parentUserId: formData.parentUserId,
						parentName: availableParents.find(
							parent => parent._id === formData.parentUserId
						)?.name,
					}),
			};

			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!formData.name || formData.name.length === 0) {
				setNameError('El nombre es requerido');
				hasErrors = true;
			}
			if (formData.email.length === 0 || !emailRegex.test(formData.email)) {
				setEmailError('El email es requerido y debe tener el formato correcto');
				hasErrors = true;
			}
			if (formData.password.length === 0) {
				setPasswordError(
					'La contraseña es requerida y debe tener al menos 8 caracteres'
				);
				hasErrors = true;
			}
			if (formData.primary_genre.length === 0) {
				setPrimaryGenreError('El género principal es requerido');
				hasErrors = true;
			}
			if (!formData.year || formData.year.length === 0) {
				setYearError('El año es requerido');
				hasErrors = true;
			}
			if (formData.catalog_number.length === 0) {
				setCatalogNumberError('El número de catálogo es requerido');
				hasErrors = true;
			}
			if (!formData.picture) {
				setimageErr('La imagen es requerida');
				hasErrors = true;
			}
			if (formData.picture instanceof File) {
				if (
					formData.picture.type !== 'image/jpeg' ||
					formData.picture.type !== 'image/jpeg'
				) {
					setimageErr('El formato de la imagen debe ser JPG');
					hasErrors = true;
				}
			} else {
				setimageErr('La imagen es requerida');

				hasErrors = true;
			}
			if (hasErrors) {
				setError('Por favor, corrige los errores antes de continuar');
				setIsSubmitting(false);
				return;
			}
			if (formData.picture instanceof File) {
				const res = await uploadFileByChunks(formData.picture, dataToSend);
				if (!res.success) {
					const errorMessage =
						typeof res.error === 'object'
							? Object.entries(res.error)
									.map(([key, value]) => {
										if (Array.isArray(value)) {
											// Manejar arrays de objetos como artists: [{ artist: ['error'] }]
											const arrayErrors = value
												.map((item, index) => {
													if (typeof item === 'object' && item !== null) {
														return Object.entries(item)
															.map(([nestedKey, nestedValue]) => {
																if (Array.isArray(nestedValue)) {
																	return `${nestedKey}: ${nestedValue.join(
																		', '
																	)}`;
																}
																return `${nestedKey}: ${nestedValue}`;
															})
															.join(', ');
													}
													return String(item);
												})
												.join(', ');
											return `${key}: ${arrayErrors}`;
										}
										if (typeof value === 'object' && value !== null) {
											// Manejar estructuras anidadas como { artists: [{ artist: ['error'] }] }
											const nestedErrors = Object.entries(value)
												.map(([nestedKey, nestedValue]) => {
													if (Array.isArray(nestedValue)) {
														return `${nestedKey}: ${nestedValue.join(', ')}`;
													}
													if (
														typeof nestedValue === 'object' &&
														nestedValue !== null
													) {
														return `${nestedKey}: ${Object.values(nestedValue)
															.flat()
															.join(', ')}`;
													}
													return `${nestedKey}: ${nestedValue}`;
												})
												.join(', ');
											return `${key}: ${nestedErrors}`;
										}
										return `${key}: ${value}`;
									})
									.filter(Boolean)
									.join('\n')
							: res.error;
					setError(errorMessage);
					throw new Error(errorMessage);
				}
			}

			await onSave({
				name: formData.name,
				email: formData.email,
				password: formData.password,
				primary_genre: formData.primary_genre,
				year: parseInt(formData.year),
				catalog_num: parseInt(formData.catalog_number),
				picture: formData.picture instanceof File ? formData.picture : null,
				isSubaccount: formData.isSubaccount,
				parentUserId: formData.parentUserId,
			});
			onClose();
		} catch (err: any) {
			console.error('Error al crear el sello:', err);
			setError(err.message || 'Error al crear el sello');
		} finally {
			setIsSubmitting(false);
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
						className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
						onClick={e => e.stopPropagation()}
					>
						<div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
							<h2 className="text-xl font-semibold text-gray-800">
								Crear Sellod
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form className="flex-1 flex flex-col min-h-0">
							<div className="p-4 space-y-4 overflow-y-auto flex-1">
								<div className="space-y-3">
									<div className="space-y-2">
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
										{imageErr && imageErr.length > 0 && (
											<p className="text-[9px] text-red-500">* {imageErr}</p>
										)}
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div>
											<label
												htmlFor="name"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Nombre
											</label>
											<input
												type="text"
												id="name"
												name="name"
												placeholder="Nombre del sello"
												value={formData.name}
												onChange={handleInputChange}
												className={inputStyles}
												required
											/>
											{nameError && nameError.length > 0 && (
												<p className="text-[9px] text-red-500">* {nameError}</p>
											)}
										</div>

										<div>
											<label
												htmlFor="email"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Email
											</label>
											<input
												type="email"
												id="email"
												placeholder="ej:sello@mail.com"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												className={inputStyles}
												required
											/>
											{emailError && emailError.length > 0 && (
												<p className="text-[9px] text-red-500">
													* {emailError}
												</p>
											)}
										</div>
									</div>

									<div>
										<label
											htmlFor="password"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Contraseña
										</label>
										<input
											type="password"
											id="password"
											name="password"
											placeholder="Contraseña"
											value={formData.password}
											onChange={handleInputChange}
											className={inputStyles}
											required
										/>
										{passwordError && passwordError.length > 0 && (
											<p className="text-[9px] text-red-500">
												* {passwordError}
											</p>
										)}
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div>
											<label
												htmlFor="primary_genre"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Género Principal
											</label>
											<Select
												id="primary_genre"
												name="primary_genre"
												value={
													formData.primary_genre
														? {
																value: formData.primary_genre,
																label: formData.primary_genre,
														  }
														: null
												}
												onChange={(selectedOption: GenreOption | null) => {
													handleInputChange({
														target: {
															name: 'primary_genre',
															value: selectedOption?.value || '',
														},
													} as React.ChangeEvent<HTMLSelectElement>);
												}}
												options={genres.map(genre => ({
													value: genre.name,
													label: genre.name,
												}))}
												placeholder="Seleccionar género"
												styles={reactSelectStyles}
												isClearable
												required
											/>
											{primaryGenreError && primaryGenreError.length > 0 && (
												<p className="text-[9px] text-red-500">
													* {primaryGenreError}
												</p>
											)}
										</div>

										<div>
											<label
												htmlFor="year"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Año
											</label>
											<Select
												id="year"
												name="year"
												value={
													formData.year
														? { value: formData.year, label: formData.year }
														: null
												}
												onChange={(selectedOption: YearOption | null) => {
													handleInputChange({
														target: {
															name: 'year',
															value: selectedOption?.value || '',
														},
													} as React.ChangeEvent<HTMLSelectElement>);
												}}
												options={Array.from(
													{ length: new Date().getFullYear() - 1899 },
													(_, i) => {
														const year = new Date().getFullYear() - i;
														return {
															value: year.toString(),
															label: year.toString(),
														};
													}
												)}
												placeholder="Seleccionar año"
												styles={reactSelectStyles}
												isClearable
												required
											/>
											{yearError && yearError.length > 0 && (
												<p className="text-[9px] text-red-500">* {yearError}</p>
											)}
										</div>
									</div>

									<div>
										<label
											htmlFor="catalog_number"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Número de Catálogo
										</label>
										<div className="relative">
											<Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
											<input
												type="text"
												id="catalog_number"
												name="catalog_number"
												value={formData.catalog_number}
												onChange={handleInputChange}
												onPaste={e => e.preventDefault()}
												className={inputStyles}
												required
											/>
										</div>
										{catalogNumberError && catalogNumberError.length > 0 && (
											<p className="text-[9px] text-red-500">
												* {catalogNumberError}
											</p>
										)}
									</div>

									{/* <div className="flex items-center space-x-2">
										<input
											type="checkbox"
											id="isSubaccount"
											name="isSubaccount"
											checked={formData.isSubaccount}
											onChange={handleInputChange}
											className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
										/>
										<label
											htmlFor="isSubaccount"
											className="text-sm text-gray-700"
										>
											Crear como subcuenta
										</label>
									</div> */}

									{/* {formData.isSubaccount && (
										<div>
											<label
												htmlFor="parentUserId"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Usuario Padre
											</label>
											<Select
												id="parentUserId"
												name="parentUserId"
												value={
													formData.parentUserId
														? {
																value: formData.parentUserId,
																label:
																	availableParents.find(
																		p => p._id === formData.parentUserId
																	)?.name || '',
														  }
														: null
												}
												onChange={(selectedOption: ParentOption | null) => {
													handleInputChange({
														target: {
															name: 'parentUserId',
															value: selectedOption?.value || '',
														},
													} as React.ChangeEvent<HTMLSelectElement>);
												}}
												options={availableParents.map(parent => ({
													value: parent._id,
													label: `${parent.name} (${parent.role})`,
												}))}
												placeholder="Seleccionar usuario padre"
												styles={reactSelectStyles}
												isClearable
												required
											/>
										</div>
									)} */}
								</div>
							</div>

							<div className="p-4 border-t border-gray-200 flex flex-col space-y-4 flex-shrink-0">
								{error && (
									<div
										className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
										role="alert"
									>
										<strong className="font-bold">Error: </strong>
										<span className="block sm:inline">{error}</span>
									</div>
								)}
								<div className="flex justify-end space-x-2">
									<button
										type="button"
										onClick={onClose}
										disabled={isSubmitting}
										className="px-3 py-1.5 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
										<span className="group-hover:text-brand-dark">
											Cancelar
										</span>
									</button>
									<button
										type="button"
										disabled={isSubmitting}
										onClick={handleSubmit}
										className="px-3 py-1.5 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isSubmitting ? (
											<>
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
												<span>Creando...</span>
											</>
										) : (
											<>
												<Save className="h-4 w-4 group-hover:text-brand-dark" />
												<span className="group-hover:text-brand-dark">
													Crear
												</span>
											</>
										)}
									</button>
								</div>
							</div>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default CreateSelloModal;
