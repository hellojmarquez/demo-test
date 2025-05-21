import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Camera, XCircle, Save } from 'lucide-react';

interface UpdateUserModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: {
		_id: string;
		name: string;
		email: string;
		picture?: string;
		role: string;
		status: string;
	};
	onUpdate: (updatedUser: any) => void;
}

const UpdateUserModal: React.FC<UpdateUserModalProps> = ({
	isOpen,
	onClose,
	user,
	onUpdate,
}) => {
	const [formData, setFormData] = useState({
		name: user.name,
		email: user.email,
		role: user.role,
		status: user.status,
		picture: user.picture || '',
	});
	const [previewImage, setPreviewImage] = useState<string | null>(
		user.picture || null
	);
	const [isLoading, setIsLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			try {
				const base64 = await convertToBase64(file);
				setPreviewImage(base64);
				setFormData(prev => ({ ...prev, picture: base64 }));
			} catch (error) {
				console.error('Error converting image:', error);
			}
		}
	};

	const convertToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					resolve(reader.result);
				}
			};
			reader.onerror = error => reject(error);
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetch(`/api/admin/updateUser/${user._id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				const updatedUser = await response.json();
				onUpdate(updatedUser);
				onClose();
			} else {
				throw new Error('Failed to update user');
			}
		} catch (error) {
			console.error('Error updating user:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
						onClick={e => e.stopPropagation()}
					>
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-xl font-semibold text-gray-800">
								Actualizar Usuario
							</h2>
							<button
								onClick={onClose}
								className="text-gray-500 hover:text-gray-700 transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="flex flex-col items-center mb-6">
								<div
									className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group"
									onClick={() => fileInputRef.current?.click()}
								>
									{previewImage ? (
										<img
											src={previewImage}
											alt="Profile"
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full bg-gray-100 flex items-center justify-center">
											<User className="w-12 h-12 text-gray-400" />
										</div>
									)}
									<div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
										<Camera className="w-6 h-6 text-white" />
									</div>
								</div>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleImageChange}
									accept="image/*"
									className="hidden"
								/>
								<p className="text-sm text-gray-500 mt-2">
									Click para cambiar la foto
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Nombre
								</label>
								<input
									type="text"
									value={formData.name}
									onChange={e =>
										setFormData(prev => ({ ...prev, name: e.target.value }))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Email
								</label>
								<input
									type="email"
									value={formData.email}
									onChange={e =>
										setFormData(prev => ({ ...prev, email: e.target.value }))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Rol
								</label>
								<select
									value={formData.role}
									onChange={e =>
										setFormData(prev => ({ ...prev, role: e.target.value }))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
									required
								>
									<option value="user">Usuario</option>
									<option value="admin">Administrador</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Estado
								</label>
								<select
									value={formData.status}
									onChange={e =>
										setFormData(prev => ({ ...prev, status: e.target.value }))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
									required
								>
									<option value="active">Activo</option>
									<option value="inactive">Inactivo</option>
								</select>
							</div>

							<div className="flex justify-end space-x-3 mt-6">
								<button
									type="button"
									onClick={onClose}
									disabled={isLoading}
									className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
									<span className="group-hover:text-brand-dark">Cancelar</span>
								</button>
								<button
									type="submit"
									disabled={isLoading}
									className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? (
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

export default UpdateUserModal;
