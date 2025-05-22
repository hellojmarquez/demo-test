import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	X,
	Save,
	Image as ImageIcon,
	XCircle,
	Upload,
	User,
	Mail,
	Lock,
} from 'lucide-react';

interface Admin {
	_id: string;
	name: string;
	email: string;
	password?: string;
	picture?: string;
	role: string;
	[key: string]: any;
}

interface UpdateAdminModalProps {
	admin: Admin;
	isOpen: boolean;
	onClose: () => void;
	onSave: (admin: Admin) => void;
}

const UpdateAdminModal: React.FC<UpdateAdminModalProps> = ({
	admin,
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState<Admin>({ ...admin });
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (admin.picture) {
			if (
				typeof admin.picture === 'string' &&
				!admin.picture.startsWith('data:') &&
				!admin.picture.startsWith('http')
			) {
				setImagePreview(`data:image/jpeg;base64,${admin.picture}`);
			} else {
				setImagePreview(admin.picture);
			}
		} else {
			console.log('No picture available');
			setImagePreview(null);
		}
		console.log(admin);
	}, [admin]);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value,
		});
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64String = reader.result as string;
				setImagePreview(base64String);
				setFormData({
					...formData,
					picture: base64String,
				});
			};
			reader.readAsDataURL(file);
		} else {
			setFormData({
				...formData,
				picture: '',
			});
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			await onSave(formData);
		} catch (error) {
			console.error('Error saving admin:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const inputStyles =
		'w-full pl-10 pr-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

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
								Editar Administrador
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6">
							<div className="space-y-2 mb-6">
								<label className="block text-sm font-medium text-gray-700">
									Foto de Perfil
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

							<div className="space-y-4">
								<div className="relative">
									<label
										htmlFor="name"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Nombre
									</label>
									<div className="relative">
										<User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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

								<div className="relative">
									<label
										htmlFor="email"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Email
									</label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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

								<div className="relative">
									<label
										htmlFor="password"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Contraseña
									</label>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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

							<div className="flex justify-end space-x-3 mt-6">
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

export default UpdateAdminModal;
