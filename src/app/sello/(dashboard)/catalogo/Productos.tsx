import React, { useEffect, useState } from 'react';
import {
	Pencil,
	ChevronDown,
	ChevronUp,
	Music,
	Calendar,
	Globe,
	Tag,
	Users,
	Disc,
	Youtube,
	Trash2,
	CheckCircle,
	XCircle,
	Hash,
	Languages,
	Archive,
	Barcode,
	Plus,
} from 'lucide-react';
import Link from 'next/link';
import UpdateReleaseModal from '@/components/UpdateReleaseModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CreateInitRelease from '@/components/CreateInitRelease';
import { toast } from 'react-hot-toast';

interface PictureObject {
	picture: string;
}

interface Release {
	_id: string;
	__v: number;
	artists: any[];
	auto_detect_language: boolean;
	backcatalog: boolean;
	countries: string[];
	createdAt: string;
	updatedAt: string;
	dolby_atmos: boolean;
	generate_ean: boolean;
	kind: string;
	label: string;
	language: string;
	name: string;
	picture: string | null;
	tracks: any[];
	youtube_declaration: boolean;
}

interface ReleaseForAPI {
	_id: string;
	__v: number;
	artists: any[];
	auto_detect_language: boolean;
	backcatalog: boolean;
	countries: string[];
	createdAt: string;
	updatedAt: string;
	dolby_atmos: boolean;
	generate_ean: boolean;
	kind: string;
	label: string;
	language: string;
	name: string;
	picture: string | null;
	tracks: any[];
	youtube_declaration: boolean;
}

interface ReleaseForModal extends Omit<Release, 'picture'> {
	picture: string | null;
	track_length: string;
}

const Productos: React.FC = () => {
	const [releases, setReleases] = useState<Release[]>([]);
	const [expandedRelease, setExpandedRelease] = useState<string | null>(null);
	const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [successMessageType, setSuccessMessageType] = useState<
		'create' | 'delete' | null
	>(null);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const router = useRouter();
	useEffect(() => {
		const fetchReleases = async () => {
			setLoading(true);
			try {
				const res = await fetch('/api/admin/getAllReleases', {
					cache: 'no-store',
					headers: {
						'Cache-Control': 'no-cache',
					},
				});
				const data = await res.json();
				if (data.success) {
					setReleases(data.data as Release[]);
					console.log('data.data: ', data.data);
				}
			} catch (error) {
				console.error('Error fetching releases:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchReleases();
	}, []);

	const handleToggleExpand = (id: string) => {
		setExpandedRelease(currentId => (currentId === id ? null : id));
	};

	const handleEdit = (e: React.MouseEvent, release: Release) => {
		e.preventDefault();
		e.stopPropagation();
		router.push(`/sello/catalogo/edit?releaseId=${release._id}`);
	};

	const handleSaveEdit = async (updatedRelease: ReleaseForModal) => {
		try {
			// Convert the picture object back to string for the API
			const releaseToSend: ReleaseForAPI = {
				...updatedRelease,
				picture: updatedRelease.picture || null,
			};

			const response = await fetch(
				`/api/admin/updateRelease/${updatedRelease._id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(releaseToSend),
				}
			);

			if (response.ok) {
				// Convert the picture back to string for the local state
				const updatedReleaseForState: Release = {
					...updatedRelease,
					picture: updatedRelease.picture || null,
				};

				setReleases(prev =>
					prev.map(release =>
						release._id === updatedRelease._id
							? updatedReleaseForState
							: release
					)
				);
				setIsEditModalOpen(false);
				setSelectedRelease(null);
				setShowSuccessMessage(true);
				setSuccessMessageType('create');
				setTimeout(() => {
					setShowSuccessMessage(false);
					setSuccessMessageType(null);
				}, 3000);
			} else {
				console.error('Error updating release');
			}
		} catch (error) {
			console.error('Error updating release:', error);
		}
	};

	const handleDelete = async (e: React.MouseEvent, release: Release) => {
		e.preventDefault();
		e.stopPropagation();

		if (!confirm(`¿Estás seguro de que deseas eliminar "${release.name}"?`)) {
			return;
		}

		setIsDeleting(release._id);

		try {
			const response = await fetch(`/api/admin/deleteRelease/${release._id}`, {
				method: 'DELETE',
			});

			const data = await response.json();

			if (response.ok) {
				setReleases(prev => prev.filter(r => r._id !== release._id));
				setShowSuccessMessage(true);
				setSuccessMessageType('delete');
				setTimeout(() => {
					setShowSuccessMessage(false);
					setSuccessMessageType(null);
				}, 3000);
			} else {
				alert(data.message || 'Error al eliminar el producto');
			}
		} catch (error) {
			console.error('Error deleting release:', error);
			alert('Error al eliminar el producto');
		} finally {
			setIsDeleting(null);
		}
	};

	const handleCreateRelease = async (data: {
		title: string;
		image: File | null;
	}) => {
		setIsModalOpen(false);
		setShowSuccessMessage(true);
		setSuccessMessageType('create');

		// Actualizar la lista de productos
		try {
			const res = await fetch('/api/admin/getAllReleases');
			const response = await res.json();
			if (response.success) {
				setReleases(response.data);
			}
		} catch (error) {
			console.error('Error fetching releases:', error);
		}

		setTimeout(() => {
			setShowSuccessMessage(false);
			setSuccessMessageType(null);
		}, 3000);
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-dark"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 backdrop-blur-sm"
				>
					<CheckCircle size={20} />
					<span className="font-medium">
						{successMessageType === 'create'
							? 'Producto creado exitosamente'
							: 'Producto eliminado exitosamente'}
					</span>
				</motion.div>
			)}
			<div className="max-w-7xl mx-auto">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold text-gray-800">
						Catálogo de Lanzamientos
					</h1>
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => setIsModalOpen(true)}
						className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-light text-white rounded-xl hover:bg-brand-dark transition-all duration-200 shadow-md group"
					>
						<Plus className="h-5 w-5" />
						<span className="font-medium">Crear lanzamiento</span>
					</motion.button>
				</div>

				{releases.length === 0 ? (
					<motion.div
						key="no-releases"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-gray-500 text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100"
					>
						<Music className="h-20 w-20 mx-auto text-gray-300 mb-6" />
						<p className="text-2xl font-semibold text-gray-700">
							No hay lanzamientos disponibles
						</p>
						<p className="text-base text-gray-400 mt-3">
							Agrega un nuevo lanzamiento para comenzar
						</p>
					</motion.div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{releases.map(release => (
							<motion.div
								key={release._id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
								className={`bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group ${
									expandedRelease === release._id
										? 'col-span-full md:col-span-2 lg:col-span-3'
										: ''
								}`}
							>
								<div className="flex flex-col md:flex-row">
									<div className="relative aspect-square md:w-1/3">
										{release.picture ? (
											<motion.img
												whileHover={{ scale: 1.05 }}
												transition={{ duration: 0.2 }}
												src={release.picture}
												alt={release.name}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
												<Music className="h-16 w-16 text-gray-400" />
											</div>
										)}
										<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
										<div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
											<motion.button
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												onClick={e => handleEdit(e, release)}
												className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors"
											>
												<Pencil className="h-5 w-5 text-brand-light" />
											</motion.button>
											<motion.button
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												onClick={e => handleDelete(e, release)}
												disabled={isDeleting === release._id}
												className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors"
											>
												{isDeleting === release._id ? (
													<div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
												) : (
													<Trash2 className="h-5 w-5 text-red-500" />
												)}
											</motion.button>
										</div>
									</div>
									<div className="flex-1 p-6">
										<div className="flex justify-between items-start mb-4">
											<h2 className="text-xl font-bold text-gray-900 line-clamp-1">
												{release.name}
											</h2>
											<motion.button
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={() => handleToggleExpand(release._id)}
												className="text-sm text-brand-light hover:text-brand-dark font-medium flex items-center gap-1"
											>
												{expandedRelease === release._id ? (
													<>
														<span>Ver menos</span>
														<ChevronUp className="h-4 w-4" />
													</>
												) : (
													<>
														<span>Ver detalles</span>
														<ChevronDown className="h-4 w-4" />
													</>
												)}
											</motion.button>
										</div>
										<div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
											<Tag className="h-4 w-4 text-brand-light" />
											<span>{release.label}</span>
										</div>
										<div className="flex items-center gap-2 text-sm text-gray-400">
											<Calendar className="h-4 w-4" />
											<span>
												{new Date(release.createdAt).toLocaleDateString()}
											</span>
										</div>

										{expandedRelease === release._id && (
											<motion.div
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: 'auto' }}
												exit={{ opacity: 0, height: 0 }}
												transition={{
													duration: 0.4,
													ease: 'easeInOut',
													height: {
														duration: 0.5,
														ease: [0.4, 0, 0.2, 1],
													},
												}}
												className="mt-6 border-t border-gray-100 pt-6"
											>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
													<div className="space-y-3">
														<p className="flex items-center gap-2">
															<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
																<Hash className="h-4 w-4 text-brand-light" />{' '}
																ID:
															</span>
															<span className="text-gray-600">
																{release._id}
															</span>
														</p>
														<p className="flex items-center gap-2">
															<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
																<Languages className="h-4 w-4 text-brand-light" />{' '}
																Idioma:
															</span>
															<span className="text-gray-600">
																{release.language}
															</span>
														</p>
														<p className="flex items-center gap-2">
															<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
																<Disc className="h-4 w-4 text-brand-light" />{' '}
																Tipo:
															</span>
															<span className="text-gray-600">
																{release.kind}
															</span>
														</p>
													</div>
													<div className="space-y-3">
														<p className="flex items-center gap-2">
															<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
																<Globe className="h-4 w-4 text-brand-light" />{' '}
																Países:
															</span>
															<span className="text-gray-600">
																{release.countries.join(', ')}
															</span>
														</p>
														<p className="flex items-center gap-2">
															<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
																<Disc className="h-4 w-4 text-brand-light" />{' '}
																Dolby Atmos:
															</span>
															<span className="text-gray-600">
																{release.dolby_atmos ? (
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
																<Archive className="h-4 w-4 text-brand-light" />{' '}
																Backcatalog:
															</span>
															<span className="text-gray-600">
																{release.backcatalog ? (
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
													</div>
												</div>

												<div className="mt-6 pt-6 border-t border-gray-100">
													<p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
														<Users className="h-4 w-4 text-brand-light" />{' '}
														Artistas
													</p>
													<div className="flex flex-wrap gap-2">
														{release.artists.length > 0 ? (
															release.artists.map(
																(artist: any, index: number) => (
																	<span
																		key={`${release._id}-artist-${index}`}
																		className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full text-sm"
																	>
																		<span className="text-xs bg-brand-light/10 text-brand-light px-2 py-0.5 rounded-full">
																			{artist.kind === 'main'
																				? 'Principal'
																				: artist.kind === 'featuring'
																				? 'Featuring'
																				: artist.kind === 'remixer'
																				? 'Remixer'
																				: artist.kind}
																		</span>
																		<span className="text-gray-700">
																			{artist.name}
																		</span>
																	</span>
																)
															)
														) : (
															<span className="text-gray-400">
																No hay artistas
															</span>
														)}
													</div>
												</div>

												<div className="mt-6 pt-6 border-t border-gray-100">
													<p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
														<Music className="h-4 w-4 text-brand-light" />{' '}
														Pistas
													</p>
													<div className="space-y-2">
														{release.tracks.length > 0 ? (
															release.tracks.map(
																(track: any, index: number) => (
																	<div
																		key={`${release._id}-track-${
																			track.id || index
																		}`}
																		className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg"
																	>
																		<Music className="h-4 w-4 text-gray-400" />
																		<span>{track.name}</span>
																	</div>
																)
															)
														) : (
															<span className="text-gray-400">
																No hay pistas
															</span>
														)}
													</div>
												</div>
											</motion.div>
										)}
									</div>
								</div>
							</motion.div>
						))}
					</div>
				)}
			</div>

			{/* Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
					<div className="relative">
						<CreateInitRelease
							onCancel={() => setIsModalOpen(false)}
							onSubmit={handleCreateRelease}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default Productos;
