import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Building2,
	Trash2,
	Calendar,
	Tag,
	CheckCircle,
	XCircle,
	Hash,
	Pencil,
	ChevronDown,
	ChevronUp,
	FileText,
	ClipboardCheck,
	Award,
	Users,
	Image as ImageIcon,
	Clock,
} from 'lucide-react';
import UpdateSelloModal from '@/components/UpdateSelloModal';
import { Sello } from '@/types/sello';

export default function SellosPage() {
	const [sellos, setSellos] = useState<Sello[]>([]);
	const [expandedSello, setExpandedSello] = useState<string | null>(null);
	const [selectedSello, setSelectedSello] = useState<Sello | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchSellos = async () => {
			setLoading(true);
			try {
				const res = await fetch('/api/admin/getAllSellos');
				const response = await res.json();
				console.log('Respuesta completa de la API:', response);

				// Asegurarnos de que response.data sea un array
				const sellosData = Array.isArray(response.data) ? response.data : [];

				// Asegurarse de que cada sello tenga la estructura correcta
				const sellosFormateados = sellosData.map((sello: Sello) => {
					// Convertir year y catalog_num a números
					const year =
						typeof sello.year === 'string'
							? parseInt(sello.year, 10)
							: sello.year;
					const catalog_num =
						typeof sello.catalog_num === 'string'
							? parseInt(sello.catalog_num, 10)
							: sello.catalog_num;

					return {
						...sello,
						year,
						catalog_num,
						picture: sello.picture || null,
					};
				});

				setSellos(sellosFormateados);
			} catch (error) {
				console.error('Error fetching sellos:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchSellos();
	}, []);

	const toggleExpand = (selloId: string) => {
		setExpandedSello(expandedSello === selloId ? null : selloId);
	};

	const handleEdit = async (formData: FormData) => {
		try {
			const response = await fetch(
				`/api/admin/updateSello/${formData.get('_id')}`,
				{
					method: 'PUT',
					body: formData,
				}
			);

			if (!response.ok) {
				throw new Error('Failed to update sello');
			}

			const updatedSello = await response.json();
			console.log('Sello actualizado recibido');

			// Actualizar el estado con el sello actualizado
			setSellos(prevSellos =>
				prevSellos.map(s => (s._id === updatedSello._id ? updatedSello : s))
			);

			setShowSuccessMessage(true);
			setTimeout(() => setShowSuccessMessage(false), 3000);

			// Cerrar el modal después de una actualización exitosa
			setIsEditModalOpen(false);
			setSelectedSello(null);
		} catch (error) {
			console.error('Error updating sello:', error);
		}
	};

	const handleDelete = async (e: React.MouseEvent, sello: Sello) => {
		e.stopPropagation();

		if (!confirm(`¿Estás seguro de que deseas eliminar "${sello.name}"?`)) {
			return;
		}

		setIsDeleting(sello._id);

		try {
			const response = await fetch(`/api/admin/deleteSello/${sello._id}`, {
				method: 'DELETE',
			});

			const data = await response.json();

			if (response.ok) {
				setSellos(prev => prev.filter(s => s._id !== sello._id));
				setShowSuccessMessage(true);
				setTimeout(() => setShowSuccessMessage(false), 3000);
			} else {
				alert(data.message || 'Error al eliminar el sello');
			}
		} catch (error) {
			console.error('Error deleting sello:', error);
			alert('Error al eliminar el sello');
		} finally {
			setIsDeleting(null);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-dark"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{showSuccessMessage && (
				<motion.div
					key="success-message"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2"
				>
					<CheckCircle size={18} />
					<span>Sello eliminado exitosamente</span>
				</motion.div>
			)}

			{!sellos || sellos.length === 0 ? (
				<motion.div
					key="empty-state"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-gray-500 text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100"
				>
					<Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
					<p className="text-xl font-medium">No hay sellos disponibles.</p>
					<p className="text-sm text-gray-400 mt-2">
						Agrega un nuevo sello para comenzar.
					</p>
				</motion.div>
			) : (
				sellos.map(sello => (
					<motion.div
						key={`sello-${sello._id}`}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
					>
						<div
							onClick={() => toggleExpand(sello._id)}
							className="p-5 cursor-pointer flex items-center justify-between"
						>
							<div className="flex-1 flex items-center gap-5">
								{sello.picture ? (
									<motion.img
										key={`logo-${sello._id}`}
										whileHover={{ scale: 1.05 }}
										transition={{ duration: 0.2 }}
										src={sello.picture || '/suitcase.png'}
										alt={sello.name}
										className="w-20 h-20 object-cover rounded-lg shadow-sm"
									/>
								) : (
									<div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg shadow-sm">
										<Building2 className="h-8 w-8 text-gray-400" />
									</div>
								)}
								<div>
									<h2 className="text-xl font-semibold text-gray-900 mb-1">
										{sello.name}
									</h2>
									<div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
										<Hash className="h-4 w-4 text-brand-light" />
										<span>Catálogo: {sello.catalog_num}</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
										<Calendar className="h-3 w-3" />
										<span>Año: {sello.year}</span>
									</div>
								</div>
							</div>
							<div className="flex items-center">
								<motion.button
									key={`edit-btn-${sello._id}`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={e => {
										e.stopPropagation();
										setSelectedSello(sello);
										setIsEditModalOpen(true);
									}}
									className="p-2.5 flex items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
								>
									<Pencil
										className="text-brand-light hover:text-brand-dark"
										size={18}
									/>
								</motion.button>
								<motion.button
									key={`delete-btn-${sello._id}`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={e => handleDelete(e, sello)}
									disabled={isDeleting === sello._id}
									className="p-2.5 flex items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
								>
									{isDeleting === sello._id ? (
										<div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
									) : (
										<Trash2
											className="text-red-500 hover:text-red-700"
											size={18}
										/>
									)}
								</motion.button>
								{expandedSello === sello._id ? (
									<ChevronUp className="h-5 w-5 text-gray-400" />
								) : (
									<ChevronDown className="h-5 w-5 text-gray-400" />
								)}
							</div>
						</div>

						<AnimatePresence>
							{expandedSello === sello._id && (
								<motion.div
									key={`expanded-${sello._id}`}
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: 'auto', opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.2 }}
									className="border-t border-gray-100"
								>
									<div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
										<div className="space-y-3">
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Hash className="h-4 w-4 text-brand-light" /> ID:
												</span>
												<span className="text-gray-600">{sello._id}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Tag className="h-4 w-4 text-brand-light" /> Catálogo:
												</span>
												<span className="text-gray-600">
													{sello.catalog_num}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Calendar className="h-4 w-4 text-brand-light" /> Año:
												</span>
												<span className="text-gray-600">{sello.year}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Users className="h-4 w-4 text-brand-light" />{' '}
													Artistas:
												</span>
												<span className="text-gray-600">
													{sello.assigned_artists &&
													sello.assigned_artists.length > 0
														? sello.assigned_artists.join(', ')
														: 'No hay artistas asignados'}
												</span>
											</p>
										</div>
										<div className="space-y-3">
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<FileText className="h-4 w-4 text-brand-light" />{' '}
													Contrato recibido:
												</span>
												<span className="text-gray-600">
													{sello.contract_received ? (
														<span className="flex items-center gap-1 text-green-600">
															<CheckCircle className="h-4 w-4" /> Sí
														</span>
													) : (
														<span className="flex items-center gap-1 text-red-500">
															<XCircle className="h-4 w-4" /> No
														</span>
													)}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<ClipboardCheck className="h-4 w-4 text-brand-light" />{' '}
													Información aceptada:
												</span>
												<span className="text-gray-600">
													{sello.information_accepted ? (
														<span className="flex items-center gap-1 text-green-600">
															<CheckCircle className="h-4 w-4" /> Sí
														</span>
													) : (
														<span className="flex items-center gap-1 text-red-500">
															<XCircle className="h-4 w-4" /> No
														</span>
													)}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Award className="h-4 w-4 text-brand-light" /> Label
													aprobado:
												</span>
												<span className="text-gray-600">
													{sello.label_approved ? (
														<span className="flex items-center gap-1 text-green-600">
															<CheckCircle className="h-4 w-4" /> Sí
														</span>
													) : (
														<span className="flex items-center gap-1 text-red-500">
															<XCircle className="h-4 w-4" /> No
														</span>
													)}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Clock className="h-4 w-4 text-brand-light" /> Creado:
												</span>
												<span className="text-gray-600">
													{formatDate(sello.created_at || '')}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Clock className="h-4 w-4 text-brand-light" />{' '}
													Actualizado:
												</span>
												<span className="text-gray-600">
													{formatDate(sello.updatedAt || '')}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Tag className="h-4 w-4 text-brand-light" /> Estado:
												</span>
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${
														sello.status === 'active'
															? 'bg-green-100 text-green-800'
															: 'bg-gray-100 text-gray-800'
													}`}
												>
													{sello.status === 'active' ? 'Activo' : sello.status}
												</span>
											</p>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				))
			)}

			{selectedSello && (
				<UpdateSelloModal
					sello={selectedSello}
					isOpen={isEditModalOpen}
					onClose={() => {
						setIsEditModalOpen(false);
						setSelectedSello(null);
					}}
					onSave={handleEdit}
				/>
			)}
		</div>
	);
}
