import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	X,
	ImageIcon,
	Upload,
	Save,
	XCircle,
	AlertTriangle,
	User,
	Mail,
	UserRoundCheck,
	Lock,
	Trash2,
} from 'lucide-react';
import Select from 'react-select';
import { Artista } from '@/types/artista';
import { toast } from 'react-hot-toast';

interface User {
	_id: string;
	name: string;
	email: string;
	role: string;
}

interface UpdateArtistaModalProps {
	artista: Artista;
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: FormData | Artista) => Promise<void>;
	err: string | null;
}

const statusOptions = [
	{ value: 'activo', label: 'Activo' },
	{ value: 'inactivo', label: 'Inactivo' },
	{ value: 'banneado', label: 'Banneado' },
];

const UpdateArtistaModal: React.FC<UpdateArtistaModalProps> = ({
	artista,
	isOpen,
	onClose,
	err,
	onSave,

}) => {
	const [formData, setFormData] = useState<Artista>({
		...artista,
		external_id: artista.external_id,
		status: artista.status || 'activo',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [users, setUsers] = useState<User[]>([]);
	const [isLoadingUsers, setIsLoadingUsers] = useState(false);
	const [selectedMainAccount, setSelectedMainAccount] = useState<User | null>(
		null
	);
	const [selectedSubAccounts, setSelectedSubAccounts] = useState<User[]>([]);
	const [existingRelationships, setExistingRelationships] = useState<any[]>([]);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(() => {
		if (!artista.picture) return null;
		if (typeof artista.picture === 'string') {
			if (artista.picture.startsWith('data:')) {
				return artista.picture;
			}
			if (artista.picture.startsWith('http')) {
				return artista.picture;
			}
			return `data:image/jpeg;base64,${artista.picture}`;
		}
		return null;
	});

	const [nameError, setNameError] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Obtener usuarios al abrir el modal
	useEffect(() => {
		if (isOpen) {
			fetchUsers();
			fetchExistingRelationships();
		}
	}, [isOpen]);

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
			setError('Error al cargar los usuarios');
		} finally {
			setIsLoadingUsers(false);
		}
	};

	// Función para obtener las relaciones existentes
	const fetchExistingRelationships = async () => {
		try {
			const response = await fetch(
				`/api/admin/getUserRelations/${artista._id}`
			);

			if (!response.ok) throw new Error('Error al obtener relaciones');
			const data = await response.json();

			// Usar la estructura correcta de la respuesta
			setExistingRelationships(data.data.subAccounts || []);
		} catch (error) {
			console.error('Error al obtener relaciones:', error);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value, type } = e.target;

		if (type === 'checkbox') {
			const checkbox = e.target as HTMLInputElement;
			setFormData({
				...formData,
				[name]: checkbox.checked,
			});
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
			// Crear URL para vista previa
			const previewUrl = URL.createObjectURL(file);
			setImagePreview(previewUrl);

			// Guardar el archivo directamente
			setFormData(prev => ({
				...prev,
				picture: file, // Guardar como File, no como base64
			}));
		}
	};

	// Función para subir un chunk

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setNameError(null);
		setEmailError(null);
		setError(null);
		let hasError = false;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		try {
			if (!formData.name || formData.name.length === 0) {
				setNameError('El nombre es requerido');
				hasError = true;
			}
			if (!formData.email || !emailRegex.test(formData.email)) {
				setEmailError('El email es requerido y debe tener el formato correcto');
				hasError = true;
			}
			if (hasError) {
				setError('Por favor, corrige los errores en el formulario');
				setIsSubmitting(false);
				return;
			}
			const dataToSend = new FormData();
			let formDataToSend = {
				name: formData.name,
				email: formData.email,
				role: 'artista',
				_id: formData._id,
				external_id: artista.external_id?.toString() || '',
				status: formData.status || 'activo',
				amazon_music_identifier: formData.amazon_music_identifier || '',
				apple_identifier: formData.apple_identifier || '',
				deezer_identifier: formData.deezer_identifier || '',
				spotify_identifier: formData.spotify_identifier || '',
				password: formData.password || '',
				mainAccountId: selectedMainAccount?._id || '',
				subAccounts: selectedSubAccounts.map(account => ({
					subAccountId: account._id,
					status: 'activo',
					role: account.role,
				})),
				relationshipStatus: 'activo',
			};

			// Solo agrega la contraseña si existe
			dataToSend.append('data', JSON.stringify(formDataToSend));
			if (formData.picture instanceof File) {
				if (
					formData.picture.type === 'image/jpeg' ||
					formData.picture.type === 'image/jpg' ||
					formData.picture.type === 'image/png'
				) {
					dataToSend.append('picture', formData.picture);
				} else {
					setError('El formato de imagen debe de ser jpg o png');
					throw new Error('Formato de imagen no soportado');
				}
			}
			await onSave(dataToSend);
			if (err) {
				return;
			} else {
				onClose();
			}
		} catch (error) {
			console.error('Error saving artista:', error);
			setError(
				error instanceof Error ? error.message : 'Error al guardar el artista'
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Función para eliminar una relación
	const handleDeleteRelationship = async (relationshipId: string) => {
		try {
			setIsDeleting(relationshipId);
			const response = await fetch('/api/admin/accountRelationships', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					mainAccountId: artista._id,
					subAccountId: relationshipId,
				}),
			});

			if (!response.ok) {
				throw new Error('Error al eliminar la relación');
			}

			// Actualizar la lista de relaciones
			setExistingRelationships(prev =>
				prev.filter(rel => rel._id !== relationshipId)
			);

			// Mostrar mensaje de éxito
			toast.success('Relación eliminada exitosamente');
		} catch (error) {
			console.error('Error al eliminar la relación:', error);
			toast.error('Error al eliminar la relación');
		} finally {
			setIsDeleting(null);
		}
	};

	if (!isOpen) return null;

	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

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
						<div className="p-6 border-b border-gray-200 flex justify-between items-center">
							<h2 className="text-xl font-semibold text-gray-800">
								Editar Artista
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form className="p-6">
							<div className="space-y-4">
								<div className="space-y-4">
									<label className="block text-sm font-medium text-gray-700">
										Foto del Artista
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

								<div>
									<label
										htmlFor="name"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Nombre
									</label>
									<div className="relative">
										<User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
										<input
											type="text"
											id="name"
											name="name"
											value={formData.name}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											required
											disabled={isSubmitting}
										/>
										{nameError && (
											<p className="text-red-500 text-[9px] mt-1">
												{nameError}
											</p>
										)}
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
										<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
										<input
											type="email"
											id="email"
											name="email"
											value={formData.email}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											required
											disabled={isSubmitting}
										/>
										{emailError && (
											<p className="text-red-500 text-[9px] mt-1">
												{emailError}
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
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
										<input
											type="password"
											id="password"
											name="password"
											value={formData.password || ''}
											onChange={handleChange}
											className={`${inputStyles} pl-10`}
											placeholder="Dejar en blanco para mantener la contraseña actual"
											disabled={isSubmitting}
										/>
									</div>
								</div>
								<div>
									<label
										htmlFor="status"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Estado
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<UserRoundCheck className="h-5 w-5 text-gray-400" />
										</div>
										<Select
											id="status"
											value={
												statusOptions.find(
													option => option.value === formData.status
												) || null
											}
											onChange={selectedOption =>
												setFormData(prev => ({
													...prev,
													status: (selectedOption?.value || 'activo') as
														| 'activo'
														| 'inactivo'
														| 'banneado',
												}))
											}
											options={statusOptions}
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
												singleValue: base => ({
													...base,
													color: '#1F2937',
												}),
											}}
											isSearchable={false}
											placeholder="Seleccionar estado"
											isDisabled={isSubmitting}
											className="pl-10"
										/>
									</div>
									{formData.status === 'banneado' && (
										<div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
											<AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
											<p className="text-sm text-red-700">
												Si realiza esa acción este usuario{' '}
												<span className="font-semibold">
													no podrá acceder al sitio web
												</span>
											</p>
										</div>
									)}
								</div>

								{/* Sección de Gestión de Cuentas */}
								<div className="space-y-4">
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
												{existingRelationships.map(rel => {
													return (
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
													);
												})}
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
											onChange={newValue =>
												setSelectedSubAccounts(newValue as User[])
											}
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
							</div>
							{error && (
								<div className=" mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
									{error}
								</div>
							)}
							{err && (
								<div className=" mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
									{err}
								</div>
							)}
							<div className="mt-6 flex justify-end space-x-3">
								<button
									type="button"
									onClick={onClose}
									disabled={isSubmitting}
									className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
									<span className="group-hover:text-brand-dark">Cancelar</span>
								</button>
								<button
									type="submit"
									onClick={handleSubmit}
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
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default UpdateArtistaModal;
