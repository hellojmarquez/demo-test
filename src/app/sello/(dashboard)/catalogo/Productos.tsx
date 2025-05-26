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
} from 'lucide-react';
import Link from 'next/link';
import UpdateReleaseModal from '@/components/UpdateReleaseModal';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CreateInitRelease from '@/components/CreateInitRelease';
import Pagination from '@/components/Pagination';
import SearchInput from '@/components/SearchInput';
import SortSelect from '@/components/SortSelect';

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
	label_name: string;
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
					setReleases(data.data.releases as Release[]);
					setTotalPages(data.data.pagination.totalPages);
					setTotalItems(data.data.pagination.total);
					console.log('data.data: ', data.data);
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

			console.log('Publishers response:', publishersData);

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
				console.log('Setting publishers:', publishersData.data);
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
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
						{releases && releases.length > 0 ? (
							releases.map(release => (
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
													<Music className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
												</div>
											)}
											<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
											<div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
												<motion.button
													whileHover={{ scale: 1.1 }}
													whileTap={{ scale: 0.9 }}
													onClick={e => handleEdit(e, release)}
													className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors"
												>
													<Pencil className="h-4 w-4 sm:h-5 sm:w-5 text-brand-light" />
												</motion.button>
												<motion.button
													whileHover={{ scale: 1.1 }}
													whileTap={{ scale: 0.9 }}
													onClick={e => handleDelete(e, release)}
													disabled={isDeleting === release._id}
													className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors"
												>
													{isDeleting === release._id ? (
														<div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
													) : (
														<Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
													)}
												</motion.button>
											</div>
										</div>
										<div className="flex-1 p-4 sm:p-6">
											<div className="flex justify-between items-start mb-3 sm:mb-4">
												<h2 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">
													{release.name}
												</h2>
												<motion.button
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													onClick={() => handleToggleExpand(release._id)}
													className="text-xs sm:text-sm text-brand-light hover:text-brand-dark font-medium flex items-center gap-1"
												>
													{expandedRelease === release._id ? (
														<>
															<span>Ver menos</span>
															<ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
														</>
													) : (
														<>
															<span>Ver detalles</span>
															<ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
														</>
													)}
												</motion.button>
											</div>
											<div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
												<BriefcaseBusiness className="h-3 w-3 sm:h-4 sm:w-4 text-brand-light" />
												<span>{release.label_name}</span>
											</div>
											<div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
												<Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
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
													className="mt-4 sm:mt-6 border-t border-gray-100 pt-4 sm:pt-6"
												>
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
														<div className="space-y-2 sm:space-y-3">
															<p className="flex items-center gap-2">
																<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																	<Hash className="h-3 w-3 sm:h-4 sm:w-4 text-brand-light" />{' '}
																	ID:
																</span>
																<span className="text-gray-600 text-sm">
																	{release._id}
																</span>
															</p>
															<p className="flex items-center gap-2">
																<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																	<Languages className="h-3 w-3 sm:h-4 sm:w-4 text-brand-light" />{' '}
																	Idioma:
																</span>
																<span className="text-gray-600 text-sm">
																	{release.language}
																</span>
															</p>
															<p className="flex items-center gap-2">
																<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																	<Disc className="h-3 w-3 sm:h-4 sm:w-4 text-brand-light" />{' '}
																	Tipo:
																</span>
																<span className="text-gray-600 text-sm">
																	{release.kind}
																</span>
															</p>
														</div>
														<div className="space-y-2 sm:space-y-3">
															<p className="flex items-center gap-2">
																<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																	<Globe className="h-3 w-3 sm:h-4 sm:w-4 text-brand-light" />{' '}
																	Países:
																</span>
																<span className="text-gray-600 text-sm">
																	{release.countries.join(', ')}
																</span>
															</p>
															<p className="flex items-center gap-2">
																<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																	<Disc className="h-3 w-3 sm:h-4 sm:w-4 text-brand-light" />{' '}
																	Dolby Atmos:
																</span>
																<span className="text-gray-600 text-sm">
																	{release.dolby_atmos ? (
																		<span className="flex items-center gap-1 text-green-600">
																			<CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />{' '}
																			Sí
																		</span>
																	) : (
																		<span className="flex items-center gap-1 text-red-500">
																			<XCircle className="h-3 w-3 sm:h-4 sm:w-4" />{' '}
																			No
																		</span>
																	)}
																</span>
															</p>
															<p className="flex items-center gap-2">
																<span className="font-medium text-gray-700 min-w-[80px] sm:min-w-[100px] flex items-center gap-1 text-sm">
																	<Archive className="h-3 w-3 sm:h-4 sm:w-4 text-brand-light" />{' '}
																	Backcatalog:
																</span>
																<span className="text-gray-600 text-sm">
																	{release.backcatalog ? (
																		<span className="flex items-center gap-1 text-green-600">
																			<CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />{' '}
																			Sí
																		</span>
																	) : (
																		<span className="flex items-center gap-1 text-red-500">
																			<XCircle className="h-3 w-3 sm:h-4 sm:w-4" />{' '}
																			No
																		</span>
																	)}
																</span>
															</p>
														</div>
													</div>

													<div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
														<p className="font-medium text-gray-700 mb-2 flex items-center gap-2 text-sm">
															<Users className="h-3 w-3 sm:h-4 sm:w-4 text-brand-light" />{' '}
															Artistas
														</p>
														<div className="flex flex-wrap gap-2">
															{release.artists.length > 0 ? (
																release.artists.map(
																	(artist: any, index: number) => (
																		<span
																			key={`${release._id}-artist-${index}`}
																			className="inline-flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
																		>
																			<span className="text-xs bg-brand-light/10 text-brand-light px-1.5 sm:px-2 py-0.5 rounded-full">
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
												</motion.div>
											)}
										</div>
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
		</div>
	);
};

export default Productos;
