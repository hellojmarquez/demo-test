import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, XCircle, Users } from 'lucide-react';

interface AsignarArtistaModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (asignacionData: {
		sello_id: string;
		artista_id: string;
		fecha_inicio: string;
		fecha_fin: string;
		tipo_contrato: 'exclusivo' | 'no_exclusivo';
		porcentaje_distribucion: number;
	}) => Promise<void>;
	selloId: string;
}

const AsignarArtistaModal: React.FC<AsignarArtistaModalProps> = ({
	isOpen,
	onClose,
	onSave,
	selloId,
}) => {
	const [formData, setFormData] = useState({
		artista_id: '',
		fecha_inicio: '',
		fecha_fin: '',
		tipo_contrato: 'exclusivo' as 'exclusivo' | 'no_exclusivo',
		porcentaje_distribucion: 80,
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [availableArtists, setAvailableArtists] = useState<
		Array<{ _id: string; name: string }>
	>([]);

	useEffect(() => {
		const fetchArtists = async () => {
			try {
				const response = await fetch('/api/admin/getAllUsers');
				if (response.ok) {
					const data = await response.json();
					// Filtrar solo los artistas que no están asignados a ningún sello
					const artists = data.users
						.filter((user: any) => user.role === 'artista' && !user.parentId)
						.map((user: any) => ({
							_id: user._id,
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

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target;

		if (type === 'number') {
			const numValue = parseFloat(value);
			if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
				setFormData(prev => ({
					...prev,
					[name]: numValue,
				}));
			}
		} else {
			setFormData(prev => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError('');

		try {
			await onSave({
				sello_id: selloId,
				...formData,
			});
			onClose();
		} catch (err: any) {
			setError(err.message || 'Error al asignar el artista');
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
								Asignar Artista
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
								<div className="space-y-4">
									<div>
										<label
											htmlFor="artista_id"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Artista
										</label>
										<select
											id="artista_id"
											name="artista_id"
											value={formData.artista_id}
											onChange={handleInputChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										>
											<option value="">Seleccionar artista</option>
											{availableArtists.map(artist => (
												<option key={artist._id} value={artist._id}>
													{artist.name}
												</option>
											))}
										</select>
									</div>

									<div>
										<label
											htmlFor="tipo_contrato"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Tipo de Contrato
										</label>
										<select
											id="tipo_contrato"
											name="tipo_contrato"
											value={formData.tipo_contrato}
											onChange={handleInputChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										>
											<option value="exclusivo">Exclusivo</option>
											<option value="no_exclusivo">No Exclusivo</option>
										</select>
									</div>

									<div>
										<label
											htmlFor="fecha_inicio"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Fecha de Inicio
										</label>
										<input
											type="date"
											id="fecha_inicio"
											name="fecha_inicio"
											value={formData.fecha_inicio}
											onChange={handleInputChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div>
										<label
											htmlFor="fecha_fin"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Fecha de Fin
										</label>
										<input
											type="date"
											id="fecha_fin"
											name="fecha_fin"
											value={formData.fecha_fin}
											onChange={handleInputChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>

									<div>
										<label
											htmlFor="porcentaje_distribucion"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Porcentaje de Distribución
										</label>
										<input
											type="number"
											id="porcentaje_distribucion"
											name="porcentaje_distribucion"
											value={formData.porcentaje_distribucion}
											onChange={handleInputChange}
											min="0"
											max="100"
											step="1"
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
											required
										/>
									</div>
								</div>
							</div>

							{error && (
								<div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
									{error}
								</div>
							)}

							<div className="p-4 border-t border-gray-200 flex justify-end gap-2">
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
											<span>Asignando...</span>
										</>
									) : (
										<>
											<Users className="h-4 w-4 group-hover:text-brand-dark" />
											<span className="group-hover:text-brand-dark">
												Asignar
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

export default AsignarArtistaModal;
