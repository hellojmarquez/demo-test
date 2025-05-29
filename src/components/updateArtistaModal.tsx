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
	Plus,
	Edit,
	Trash2,
} from 'lucide-react';
import Select from 'react-select';
import { Artista } from '@/types/artista';

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
	const [subAccounts, setSubAccounts] = useState<User[]>([]);
	const [mainAccount, setMainAccount] = useState<User | null>(null);
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
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Obtener usuarios al abrir el modal
	useEffect(() => {
		if (isOpen) {
			fetchUsers();
		}
	}, [isOpen]);

	const fetchUsers = async () => {
		try {
			setIsLoadingUsers(true);
			const response = await fetch('/api/admin/getAllUsers');
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
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64String = reader.result as string;
				setImagePreview(base64String);
				const base64Data = base64String.split(',')[1];
				setFormData(prev => ({
					...prev,
					picture: base64Data,
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			const formDataToSend = new FormData();
			formDataToSend.append('name', formData.name);
			formDataToSend.append('email', formData.email);
			formDataToSend.append('role', 'artista');
			formDataToSend.append('_id', formData._id);
			formDataToSend.append(
				'external_id',
				formData.external_id?.toString() || ''
			);
			formDataToSend.append('status', formData.status || 'activo');

			if (formData.password) {
				formDataToSend.append('password', formData.password);
			}

			formDataToSend.append(
				'amazon_music_identifier',
				formData.amazon_music_identifier || ''
			);
			formDataToSend.append(
				'apple_identifier',
				formData.apple_identifier || ''
			);
			formDataToSend.append(
				'deezer_identifier',
				formData.deezer_identifier || ''
			);
			formDataToSend.append(
				'spotify_identifier',
				formData.spotify_identifier || ''
			);

			if (formData.picture instanceof File) {
				formDataToSend.append('picture', formData.picture);
			} else if (typeof formData.picture === 'string') {
				formDataToSend.append('picture', formData.picture);
			}

			await onSave(formDataToSend);
			onClose();
		} catch (error) {
			console.error('Error saving artista:', error);
			setError(
				error instanceof Error ? error.message : 'Error al guardar el artista'
			);
		} finally {
			setIsSubmitting(false);
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

						<form onSubmit={handleSubmit} className="p-6">
							{error && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
									{error}
								</div>
							)}

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
								<div className="border-t border-gray-200 pt-4 mt-4">
									<h3 className="text-sm font-medium text-gray-900 mb-4">
										Gestión de Cuentas
									</h3>
									{/* Si es subcuenta */}
									<div>
										<div className="flex items-center space-x-2 mb-3">
											<h4 className="text-sm font-medium text-gray-700">
												{mainAccount ? 'Pertenece a:' : 'Cuenta Principal'}
											</h4>
										</div>
										<div className="bg-gray-50 rounded-lg p-4">
											<div className="relative">
												<Select
													value={
														mainAccount
															? {
																	value: mainAccount._id,
																	label: (
																		<div>
																			<div className="font-medium">
																				{mainAccount.name}
																			</div>
																			<div className="text-xs text-gray-500">
																				{mainAccount.email} • {mainAccount.role}
																			</div>
																		</div>
																	),
															  }
															: null
													}
													onChange={selectedOption => {
														if (selectedOption) {
															const selectedUser = users.find(
																user => user._id === selectedOption.value
															);
															setMainAccount(selectedUser || null);
														} else {
															setMainAccount(null);
														}
													}}
													options={users.map(user => ({
														value: user._id,
														label: (
															<div>
																<div className="font-medium">{user.name}</div>
																<div className="text-xs text-gray-500">
																	{user.email} • {user.role}
																</div>
															</div>
														),
													}))}
													isClearable
													placeholder="Seleccionar cuenta principal"
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
															padding: '0',
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
													className=""
												/>
											</div>
										</div>
									</div>
									{/* Información de Relaciones */}
									<div className="space-y-6">
										{/* Si es cuenta principal */}
										<div>
											<div className="flex items-center justify-between mb-3">
												<h4 className="text-sm font-medium text-gray-700">
													Subcuentas asociadas
												</h4>
												<button
													type="button"
													className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-brand-dark bg-brand-light hover:bg-brand-dark hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
												>
													<Plus className="h-4 w-4 mr-1" />
													Agregar subcuenta
												</button>
											</div>

											{/* Lista de subcuentas */}
											<div className="bg-gray-50 rounded-lg p-4">
												{isLoadingUsers ? (
													<div className="text-center py-4">
														<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-dark mx-auto"></div>
														<p className="text-sm text-gray-500 mt-2">
															Cargando usuarios...
														</p>
													</div>
												) : subAccounts.length > 0 ? (
													<div className="space-y-3">
														{subAccounts.map(subAccount => (
															<div
																key={subAccount._id}
																className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
															>
																<div className="flex items-center space-x-3">
																	<User className="h-5 w-5 text-gray-400" />
																	<div>
																		<p className="text-sm font-medium text-gray-900">
																			{subAccount.name}
																		</p>
																		<p className="text-xs text-gray-500">
																			{subAccount.email}
																		</p>
																	</div>
																</div>
																<div className="flex items-center space-x-2">
																	<button
																		type="button"
																		className="p-1 text-gray-400 hover:text-gray-500"
																	>
																		<Edit className="h-4 w-4" />
																	</button>
																	<button
																		type="button"
																		className="p-1 text-gray-400 hover:text-red-500"
																	>
																		<Trash2 className="h-4 w-4" />
																	</button>
																</div>
															</div>
														))}
													</div>
												) : (
													<div className="text-center py-4">
														<p className="text-sm text-gray-500">
															No hay subcuentas asociadas
														</p>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							</div>

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
