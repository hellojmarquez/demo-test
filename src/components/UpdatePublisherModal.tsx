'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, XCircle } from 'lucide-react';

interface UpdatePublisherModalProps {
	publisher: {
		id: string;
		external_id: number;
		name: string;
	};
	onUpdate: () => void;
	isOpen: boolean;
	onClose: () => void;
}

export function UpdatePublisherModal({
	publisher,
	onUpdate,
	isOpen,
	onClose,
}: UpdatePublisherModalProps) {
	const [name, setName] = useState(publisher.name);
	const [isLoading, setIsLoading] = useState(false);

	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

	// Actualizar el nombre cuando cambia el publisher
	useEffect(() => {
		setName(publisher.name);
	}, [publisher]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetch(
				`/api/admin/updatePublisher/${publisher.external_id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ name }),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Error al actualizar el publisher');
			}

			toast.success('Publisher actualizado con éxito');
			onClose();
			onUpdate();
		} catch (error) {
			console.error('Error updating publisher:', error);
			toast.error(
				error instanceof Error
					? error.message
					: 'Error al actualizar el publisher'
			);
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
								Editar Publisher
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6">
							<div className="space-y-4">
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
										value={name}
										onChange={e => setName(e.target.value)}
										className={inputStyles}
										required
									/>
								</div>
							</div>

							<div className="mt-6 flex justify-end space-x-3">
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
}
