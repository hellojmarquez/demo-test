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
	Trash2,
	CheckCircle,
	XCircle,
	Hash,
	Languages,
	Archive,
	Plus,
	BriefcaseBusiness,
	AlertTriangle,
	X,
} from 'lucide-react';
import Link from 'next/link';
import UpdateReleaseModal from '@/components/UpdateReleaseModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CreateInitRelease from '@/components/CreateInitRelease';
import Pagination from '@/components/Pagination';
import SearchInput from '@/components/SearchInput';
import SortSelect from '@/components/SortSelect';
import { Release as ReleaseType, Picture } from '@/types/release';

interface Release {
	_id: string;
	external_id: string;
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
	label_name: string;
	language: string;
	name: string;
	picture: Picture | null;
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

const Productos: React.FC = () => {
	const [releases, setReleases] = useState<Release[]>([]);
	const [expandedRelease, setExpandedRelease] = useState<string | null>(null);

	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [successMessageType, setSuccessMessageType] = useState<
		'create' | 'delete' | null
	>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState('newest');
	const [artists, setArtists] = useState<{ value: string; label: string }[]>(
		[]
	);
	const [labels, setLabels] = useState<{ value: string; label: string }[]>([]);
	const [publishers, setPublishers] = useState<
		{ value: string; label: string }[]
	>([]);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [releaseToDelete, setReleaseToDelete] = useState<Release | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		const fetchReleases = async () => {
			setLoading(true);
			try {
				const res = await fetch(
					`/api/admin/getAllReleases?page=${currentPage}${
						searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
					}&sort=${sortBy}`,
					{
						cache: 'no-store',
						headers: {
							'Cache-Control': 'no-cache',
						},
					}
				);
				const data = await res.json();
				if (data.success) {
					console.log(data.data.releases);
					setReleases(data.data.releases as Release[]);
					setTotalPages(data.data.pagination.totalPages);
					setTotalItems(data.data.pagination.total);
				}
			} catch (error) {
				console.error('Error fetching releases:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchReleases();
	}, [currentPage, searchQuery, sortBy]);

	const handleToggleExpand = (id: string) => {
		setExpandedRelease(currentId => (currentId === id ? null : id));
	};

	const handleEdit = (e: React.MouseEvent, release: Release) => {
		e.preventDefault();
		e.stopPropagation();
		router.push(`/sello/catalogo/edit?releaseId=${release.external_id}`);
	};

	const handleDelete = async (e: React.MouseEvent, release: Release) => {
		e.preventDefault();
		e.stopPropagation();
		setReleaseToDelete(release);
		setShowDeleteModal(true);
	};

	const handleConfirmDelete = async () => {
		if (!releaseToDelete) return;

		setIsDeleting(true);
		setDeleteError(null);

		try {
			const response = await fetch(
				`/api/admin/deleteRelease/${releaseToDelete.external_id}`,
				{
					method: 'DELETE',
				}
			);

			const data = await response.json();

			if (response.ok) {
				setReleases(prev => prev.filter(r => r._id !== releaseToDelete._id));
				setShowSuccessMessage(true);
				setSuccessMessageType('delete');
				setTimeout(() => {
					setShowSuccessMessage(false);
					setSuccessMessageType(null);
				}, 3000);
				setShowDeleteModal(false);
			} else {
				setDeleteError(data.message || 'Error al eliminar el producto');
			}
		} catch (error) {
			console.error('Error deleting release:', error);
			setDeleteError('Error al eliminar el producto');
		} finally {
			setIsDeleting(false);
		}
	};

	const handleCreateRelease = async (data: {
		title: string;
		image: File | null;
	}) => {
		setIsModalOpen(false);
		setShowSuccessMessage(true);
		setSuccessMessageType('create');

		try {
			// Forzar revalidación de la página
			router.refresh();

			// Actualizar la lista de productos con los parámetros actuales
			const res = await fetch(
				`/api/admin/getAllReleases?page=${currentPage}${
					searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
				}&sort=${sortBy}`,
				{
					cache: 'no-store',
					headers: {
						'Cache-Control': 'no-cache',
					},
				}
			);
			const response = await res.json();
			if (response.success) {
				setReleases(response.data.releases);
				setTotalPages(response.data.pagination.totalPages);
				setTotalItems(response.data.pagination.total);
			}
		} catch (error) {
			console.error('Error fetching releases:', error);
			// Mostrar mensaje de error si es necesario
		}

		setTimeout(() => {
			setShowSuccessMessage(false);
			setSuccessMessageType(null);
		}, 3000);
	};

	const fetchData = async () => {
		try {
			const [artistsRes, labelsRes, publishersRes] = await Promise.all([
				fetch('/api/admin/getAllArtists'),
				fetch('/api/admin/getAllLabels'),
				fetch('/api/admin/getAllPublishers'),
			]);

			const [artistsData, labelsData, publishersData] = await Promise.all([
				artistsRes.json(),
				labelsRes.json(),
				publishersRes.json(),
			]);

			if (artistsData.success) {
				setArtists(
					artistsData.data.map((artist: any) => ({
						value: artist._id,
						label: artist.name,
					}))
				);
			}

			if (labelsData.success) {
				setLabels(
					labelsData.data.map((label: any) => ({
						value: label._id,
						label: label.name,
					}))
				);
			}

			if (publishersData.success) {
				setPublishers(
					publishersData.data.map((publisher: any) => ({
						value: publisher._id,
						label: publisher.name,
					}))
				);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-dark"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen p-4 sm:p-6 md:p-8">
			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 backdrop-blur-sm"
				>
					<CheckCircle size={20} />
					<span className="font-medium text-sm sm:text-base">
						{successMessageType === 'create'
							? 'Producto creado exitosamente'
							: 'Producto eliminado exitosamente'}
					</span>
				</motion.div>
			)}
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
					<h1 className="text-xl sm:text-2xl font-bold text-gray-800">
						Catálogo de Lanzamientos
					</h1>
					<div className="flex justify-end gap-4 w-full sm:w-auto">
						<div className="flex items-center gap-x-10 justify-center gap-4">
							<SearchInput
								value={searchQuery}
								onChange={setSearchQuery}
								placeholder="Buscar por nombre..."
							/>
							<SortSelect
								value={sortBy}
								onChange={setSortBy}
								options={[
									{ value: 'newest', label: 'Más recientes' },
									{ value: 'oldest', label: 'Más antiguos' },
								]}
							/>
						</div>
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => setIsModalOpen(true)}
							className="w-auto flex items-center justify-center gap-2 px-6 py-3 md:px-6 md:py-2 bg-white text-brand-light rounded-xl hover:bg-brand-dark hover:text-white transition-all duration-200 shadow-md group"
						>
							<Plus className="h-4 w-4" />
							<span className="font-medium text-sm">Crear</span>
						</motion.button>
					</div>
				</div>

				{releases.length === 0 ? (
					<motion.div
						key="no-releases"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-gray-500 text-center py-12 sm:py-20 bg-white rounded-2xl shadow-sm border border-gray-100"
					>
						<Music className="h-16 w-16 sm:h-20 sm:w-20 mx-auto text-gray-300 mb-4 sm:mb-6" />
						<p className="text-xl sm:text-2xl font-semibold text-gray-700">
							No hay lanzamientos disponibles
						</p>
						<p className="text-sm sm:text-base text-gray-400 mt-2 sm:mt-3">
							Agrega un nuevo lanzamiento para comenzar
						</p>
					</motion.div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{releases && releases.length > 0 ? (
							releases.map(release => (
								<motion.div
									key={release._id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3 }}
									className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
										expandedRelease === release._id
											? 'col-span-full md:col-span-2 lg:col-span-3'
											: ''
									}`}
								>
									<div className="relative">
										{release.picture && (
											<motion.div
												whileHover={{ scale: 1.02 }}
												transition={{ duration: 0.2 }}
												className="relative aspect-[16/9] overflow-hidden"
											>
												<img
													src={release.picture.thumb_medium}
													alt={release.name}
													className="w-full h-full object-cover"
												/>
												<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
											</motion.div>
										)}

										<div className="absolute top-4 right-4 flex items-center gap-2">
											<motion.button
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												onClick={e => handleEdit(e, release)}
												className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
											>
												<Pencil className="h-5 w-5 text-brand-light" />
											</motion.button>
											<motion.button
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												onClick={e => handleDelete(e, release)}
												disabled={isDeleting}
												className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
											>
												{isDeleting ? (
													<div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
												) : (
													<Trash2 className="h-5 w-5 text-red-500" />
												)}
											</motion.button>
										</div>
									</div>

									<div className="p-6">
										<div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
											<div className="flex-1 min-w-0">
												<h2 className="text-xl font-bold text-gray-900 mb-2 break-words">
													{release.name}
												</h2>
												<div className="flex items-center gap-3 text-sm text-gray-600">
													<div className="flex items-center gap-1">
														<BriefcaseBusiness className="h-4 w-4 text-brand-light flex-shrink-0" />
														<span className="truncate">
															{release.label_name}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
														<span>
															{new Date(release.createdAt).toLocaleDateString()}
														</span>
													</div>
												</div>
											</div>
											<motion.button
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={() => handleToggleExpand(release._id)}
												className="text-sm text-brand-light hover:text-brand-dark font-medium flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
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
												className="mt-6 pt-6 border-t border-gray-100"
											>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
													<div className="space-y-4">
														<div className="bg-gray-50 rounded-xl p-4">
															<h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
																<Hash className="h-4 w-4 text-brand-light" />
																Información Básica
															</h3>
															<div className="space-y-3">
																<p className="flex items-center gap-2">
																	<span className="text-sm text-gray-500 min-w-[80px]">
																		ID:
																	</span>
																	<span className="text-sm text-gray-700">
																		{release._id}
																	</span>
																</p>
																<p className="flex items-center gap-2">
																	<span className="text-sm text-gray-500 min-w-[80px]">
																		Idioma:
																	</span>
																	<span className="text-sm text-gray-700">
																		{release.language}
																	</span>
																</p>
																<p className="flex items-center gap-2">
																	<span className="text-sm text-gray-500 min-w-[80px]">
																		Tipo:
																	</span>
																	<span className="text-sm text-gray-700">
																		{release.kind}
																	</span>
																</p>
															</div>
														</div>
													</div>
													<div className="space-y-4">
														<div className="bg-gray-50 rounded-xl p-4">
															<h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
																<Globe className="h-4 w-4 text-brand-light" />
																Configuración
															</h3>
															<div className="space-y-3">
																<p className="flex items-center gap-2">
																	<span className="text-sm text-gray-500 min-w-[80px]">
																		Países:
																	</span>
																	<span className="text-sm text-gray-700">
																		{release.countries.join(', ')}
																	</span>
																</p>
																<p className="flex items-center gap-2">
																	<span className="text-sm text-gray-500 min-w-[80px]">
																		Dolby Atmos:
																	</span>
																	<span className="text-sm">
																		{release.dolby_atmos ? (
																			<span className="flex items-center gap-1 text-green-600">
																				<CheckCircle className="h-4 w-4" />
																				Sí
																			</span>
																		) : (
																			<span className="flex items-center gap-1 text-red-500">
																				<XCircle className="h-4 w-4" />
																				No
																			</span>
																		)}
																	</span>
																</p>
																<p className="flex items-center gap-2">
																	<span className="text-sm text-gray-500 min-w-[80px]">
																		Backcatalog:
																	</span>
																	<span className="text-sm">
																		{release.backcatalog ? (
																			<span className="flex items-center gap-1 text-green-600">
																				<CheckCircle className="h-4 w-4" />
																				Sí
																			</span>
																		) : (
																			<span className="flex items-center gap-1 text-red-500">
																				<XCircle className="h-4 w-4" />
																				No
																			</span>
																		)}
																	</span>
																</p>
															</div>
														</div>
													</div>
												</div>

												<div className="mt-6">
													<div className="bg-gray-50 rounded-xl p-4">
														<h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
															<Users className="h-4 w-4 text-brand-light" />
															Artistas
														</h3>
														<div className="flex flex-wrap gap-2">
															{release.artists.length > 0 ? (
																release.artists.map(
																	(artist: any, index: number) => (
																		<span
																			key={`${release._id}-artist-${index}`}
																			className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-sm shadow-sm"
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
																<span className="text-sm text-gray-500">
																	No hay artistas asignados
																</span>
															)}
														</div>
													</div>
												</div>
											</motion.div>
										)}
									</div>
								</motion.div>
							))
						) : (
							<div className="col-span-full text-center py-8">
								<p className="text-gray-500">No hay productos disponibles</p>
							</div>
						)}
					</div>
				)}
			</div>
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
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={totalItems}
				itemsPerPage={10}
				onPageChange={setCurrentPage}
				className="mt-4"
			/>
			<AnimatePresence>
				{showDeleteModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
						onClick={() => !isDeleting && setShowDeleteModal(false)}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={{ type: 'spring', damping: 25, stiffness: 300 }}
							className="bg-white rounded-xl shadow-xl w-full max-w-md"
							onClick={e => e.stopPropagation()}
						>
							<div className="p-6 border-b border-gray-200 flex justify-between items-center">
								<h2 className="text-xl font-semibold text-gray-800">
									Confirmar Eliminación
								</h2>
								<button
									onClick={() => !isDeleting && setShowDeleteModal(false)}
									className="p-1 rounded-full hover:bg-gray-100 transition-colors"
									disabled={isDeleting}
								>
									<X size={20} className="text-gray-500" />
								</button>
							</div>

							<div className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<AlertTriangle className="h-6 w-6 text-red-500" />
									<p className="text-gray-700">
										¿Estás seguro de que deseas eliminar el release{' '}
										<span className="font-semibold">
											{releaseToDelete?.name}
										</span>
										?
									</p>
								</div>
								<p className="text-sm text-gray-500 mb-6">
									Esta acción no se puede deshacer. Todos los datos asociados a
									este release serán eliminados permanentemente.
								</p>

								{deleteError && (
									<div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
										{deleteError}
									</div>
								)}

								<div className="flex justify-end space-x-3">
									<button
										onClick={() => !isDeleting && setShowDeleteModal(false)}
										className="px-4 py-2 rounded-md text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={isDeleting}
									>
										Cancelar
									</button>
									<button
										onClick={handleConfirmDelete}
										className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
										disabled={isDeleting}
									>
										{isDeleting ? (
											<>
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
												<span>Eliminando...</span>
											</>
										) : (
											'Eliminar'
										)}
									</button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default Productos;
