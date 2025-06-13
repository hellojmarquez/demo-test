import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	X,
	Save,
	Image as ImageIcon,
	XCircle,
	Upload,
	Hash,
} from 'lucide-react';
import Select from 'react-select';

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
		picture?: {
			base64: string;
		};
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
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64String = reader.result as string;
				// Mantener el prefijo data:image/jpeg;base64, para la vista previa
				setImagePreview(base64String);

				// Para enviar a la API, usar solo la parte base64 sin el prefijo
				const base64Data = base64String.split(',')[1];
				setFormData(prev => ({
					...prev,
					picture: { base64: base64Data },
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError('');

		try {
			const formDataToSend = new FormData();
			formDataToSend.append('name', formData.name);
			formDataToSend.append('email', formData.email);
			formDataToSend.append('password', formData.password);
			formDataToSend.append('primary_genre', formData.primary_genre);
			formDataToSend.append(
				'year',
				formData.year ? parseInt(formData.year).toString() : ''
			);
			formDataToSend.append(
				'catalog_num',
				formData.catalog_number
					? parseInt(formData.catalog_number).toString()
					: ''
			);
			formDataToSend.append('isSubaccount', formData.isSubaccount.toString());
			formDataToSend.append(
				'tipo',
				formData.isSubaccount ? 'subcuenta' : 'principal'
			);
			if (formData.isSubaccount && formData.parentUserId) {
				formDataToSend.append('parentUserId', formData.parentUserId);
				const selectedParent = availableParents.find(
					parent => parent._id === formData.parentUserId
				);
				if (selectedParent) {
					formDataToSend.append('parentName', selectedParent.name);
				}
			}

			if (formData.picture?.base64) {
				// Convertir base64 a Blob
				const base64Data = formData.picture.base64;
				const byteCharacters = atob(base64Data);
				const byteArrays = [];

				for (let offset = 0; offset < byteCharacters.length; offset += 512) {
					const slice = byteCharacters.slice(offset, offset + 512);
					const byteNumbers = new Array(slice.length);

					for (let i = 0; i < slice.length; i++) {
						byteNumbers[i] = slice.charCodeAt(i);
					}

					const byteArray = new Uint8Array(byteNumbers);
					byteArrays.push(byteArray);
				}

				const blob = new Blob(byteArrays, { type: 'image/jpeg' });
				const file = new File([blob], 'sello-picture.jpg', {
					type: 'image/jpeg',
				});
				formDataToSend.append('picture', file);
			}

			const response = await fetch('/api/admin/createSello', {
				method: 'POST',
				body: formDataToSend,
			});

			const data = await response.json();

			if (!data.success) {
				let errorMessage = 'Error al crear el sello';

				if (data.error) {
					if (Array.isArray(data.error)) {
						errorMessage = data.error.join(', ');
					} else if (typeof data.error === 'object') {
						errorMessage = JSON.stringify(data.error);
					} else {
						errorMessage = data.error;
					}
				}

				setError(errorMessage);
				return;
			}

			await onSave(data.sello);
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
								Crear Sello
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form
							onSubmit={handleSubmit}
							className="flex-1 flex flex-col min-h-0"
						>
							<div className="p-4 space-y-4 overflow-y-auto flex-1">
								<div className="space-y-3">
									<div className="space-y-2">
										<label className="block text-sm font-medium text-gray-700">
											Logo del Sello
										</label>
										<div className="flex items-center gap-3">
											<div className="w-24 h-24 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
												{imagePreview ? (
													<img
														src={imagePreview}
														alt="Preview"
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="text-center">
														<ImageIcon className="mx-auto h-6 w-6 text-gray-400" />
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
													className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
												>
													<Upload className="h-4 w-4 mr-2" />
													Subir imagen
												</button>
											</div>
										</div>
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
												value={formData.name}
												onChange={handleInputChange}
												className={inputStyles}
												required
											/>
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
												name="email"
												value={formData.email}
												onChange={handleInputChange}
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
										<input
											type="password"
											id="password"
											name="password"
											value={formData.password}
											onChange={handleInputChange}
											className={inputStyles}
											required
										/>
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
									</div>

									<div className="flex items-center space-x-2">
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
									</div>

									{formData.isSubaccount && (
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
									)}
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
										type="submit"
										disabled={isSubmitting}
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
