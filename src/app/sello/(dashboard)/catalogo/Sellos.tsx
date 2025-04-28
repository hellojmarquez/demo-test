import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Building2,
	Music,
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
} from 'lucide-react';
import UpdateSelloModal from '@/components/UpdateSelloModal';

interface Logo {
	thumb_medium: string;
	thumb_small: string;
	full_size: string;
}

interface Sello {
	catalog_num: number;
	company: string;
	contract_received: boolean;
	id: number;
	information_accepted: boolean;
	label_approved: boolean;
	logo: Logo;
	name: string;
	primary_genre: string;
	year: number;
}

const Sellos = () => {
	const [sellos, setSellos] = useState<Sello[]>([]);
	const [expandedSello, setExpandedSello] = useState<number | null>(null);
	const [selectedSello, setSelectedSello] = useState<Sello | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);

	useEffect(() => {
		fetch('/api/admin/getAllSellos')
			.then(res => res.json())
			.then(response => {
				console.log(response.data);
				setSellos(response.data);
			})
			.catch(error => console.error('Error fetching sellos:', error));
	}, []);

	const toggleExpand = (selloId: number) => {
		setExpandedSello(expandedSello === selloId ? null : selloId);
	};

	const handleEdit = (e: React.MouseEvent, sello: Sello) => {
		e.stopPropagation();
		setSelectedSello(sello);
		setIsEditModalOpen(true);
	};

	const handleSaveEdit = async (updatedSello: Sello) => {
		try {
			// Here you would typically make an API call to update the sello
			// For now, we'll just update the local state
			setSellos(prev =>
				prev.map(sello => (sello.id === updatedSello.id ? updatedSello : sello))
			);
			setIsEditModalOpen(false);
			setSelectedSello(null);
			setShowSuccessMessage(true);
			setTimeout(() => setShowSuccessMessage(false), 3000);
		} catch (error) {
			console.error('Error updating sello:', error);
		}
	};

	return (
		<div className="space-y-6">
			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2"
				>
					<CheckCircle size={18} />
					<span>Sello actualizado exitosamente</span>
				</motion.div>
			)}

			{sellos.length === 0 ? (
				<motion.div
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
						key={sello.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
					>
						<div
							onClick={() => toggleExpand(sello.id)}
							className="p-5 cursor-pointer flex items-center justify-between"
						>
							<div className="flex-1 flex items-center gap-5">
								{sello.logo && sello.logo.thumb_medium ? (
									<motion.img
										whileHover={{ scale: 1.05 }}
										transition={{ duration: 0.2 }}
										src={sello.logo.thumb_medium}
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
										<Building2 className="h-4 w-4 text-brand-light" />
										<span>{sello.company}</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
										<Calendar className="h-3 w-3" />
										<span>Año: {sello.year}</span>
									</div>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={e => handleEdit(e, sello)}
									className="p-2.5 flex gap-x-2 items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
								>
									<Pencil
										className="text-brand-light group-hover:text-brand-dark"
										size={18}
									/>
									<span className="text-brand-light group-hover:text-brand-dark font-medium">
										Editar
									</span>
								</motion.button>
								{expandedSello === sello.id ? (
									<ChevronUp className="h-5 w-5 text-gray-400" />
								) : (
									<ChevronDown className="h-5 w-5 text-gray-400" />
								)}
							</div>
						</div>

						<AnimatePresence>
							{expandedSello === sello.id && (
								<motion.div
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
												<span className="text-gray-600">{sello.id}</span>
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
													<Music className="h-4 w-4 text-brand-light" /> Género:
												</span>
												<span className="text-gray-600">
													{sello.primary_genre}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Calendar className="h-4 w-4 text-brand-light" /> Año:
												</span>
												<span className="text-gray-600">{sello.year}</span>
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
											{sello.logo && sello.logo.full_size && (
												<div className="mt-4">
													<p className="font-medium text-gray-700 mb-2">
														Logo:
													</p>
													<img
														src={sello.logo.full_size}
														alt={`Logo de ${sello.name}`}
														className="max-w-full h-auto rounded-lg shadow-sm"
													/>
												</div>
											)}
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
					onSave={handleSaveEdit}
				/>
			)}
		</div>
	);
};

export default Sellos;
