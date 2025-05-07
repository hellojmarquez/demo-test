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

interface PictureObject {
	base64: string;
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
	picture: PictureObject | null;
	track_length: string;
}

const Productos: React.FC = () => {
	const [releases, setReleases] = useState<Release[]>([]);
	const [expandedRelease, setExpandedRelease] = useState<string | null>(null);
	const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	useEffect(() => {
		const fetchReleases = async () => {
			setLoading(true);
			try {
				const res = await fetch('/api/admin/getAllReleases');
				const data = await res.json();
				if (data.success) {
					setReleases(data.data as Release[]);
					console.log(data.data);
				}
			} catch (error) {
				console.error('Error fetching releases:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchReleases();
	}, []);

	const toggleExpand = (id: string) => {
		setExpandedRelease(prev => (prev === id ? null : id));
	};

	const handleEdit = (e: React.MouseEvent, release: Release) => {
		e.stopPropagation();
		setSelectedRelease(release);
		setIsEditModalOpen(true);
	};

	const handleSaveEdit = async (updatedRelease: ReleaseForModal) => {
		try {
			// Convert the picture object back to string for the API
			const releaseToSend: ReleaseForAPI = {
				...updatedRelease,
				picture: updatedRelease.picture?.base64 || null,
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
					picture: updatedRelease.picture?.base64 || null,
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
				setTimeout(() => setShowSuccessMessage(false), 3000);
			} else {
				console.error('Error updating release');
			}
		} catch (error) {
			console.error('Error updating release:', error);
		}
	};

	const handleDelete = async (e: React.MouseEvent, release: Release) => {
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
				setTimeout(() => setShowSuccessMessage(false), 3000);
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

	if (loading) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-dark"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-end mb-4">
				<Link
					href="/sello/catalogo/crear-release"
					className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-brand-light hover:text-white transition-all duration-200 shadow-sm group min-w-[180px]"
				>
					<Plus className="h-4 w-4" />
					<span>Crear lanzamiento</span>
				</Link>
			</div>

			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2"
				>
					<CheckCircle size={18} />
					<span>Producto eliminado exitosamente</span>
				</motion.div>
			)}
			{releases.length === 0 ? (
				<motion.div
					key="no-releases"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-gray-500 text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100"
				>
					<Music className="h-16 w-16 mx-auto text-gray-300 mb-4" />
					<p className="text-xl font-medium">
						No hay lanzamientos disponibles.
					</p>
					<p className="text-sm text-gray-400 mt-2">
						Agrega un nuevo lanzamiento para comenzar.
					</p>
				</motion.div>
			) : (
				releases.map(release => (
					<motion.div
						key={release._id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
					>
						<div
							className="p-5 cursor-pointer"
							onClick={() => toggleExpand(release._id)}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-5">
									{release.picture ? (
										<motion.img
											whileHover={{ scale: 1.05 }}
											transition={{ duration: 0.2 }}
											src={release.picture}
											alt={release.name}
											className="w-20 h-20 object-cover rounded-lg shadow-sm"
										/>
									) : (
										<div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg shadow-sm">
											<Music className="h-8 w-8 text-gray-400" />
										</div>
									)}
									<div>
										<h2 className="text-xl font-semibold text-gray-900 mb-1">
											{release.name}
										</h2>
										<div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
											<Tag className="h-4 w-4 text-brand-light" />
											<span>{release.label}</span>
										</div>
										<div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
											<Calendar className="h-3 w-3" />
											<span>
												Creado:{' '}
												{new Date(release.createdAt).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
								<div className="flex items-center ">
									<motion.button
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={e => handleEdit(e, release)}
										className="p-2.5 flex items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
									>
										<Pencil
											className="text-brand-light hover:text-brand-dark"
											size={18}
										/>
									</motion.button>
									<motion.button
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={e => handleDelete(e, release)}
										disabled={isDeleting === release._id}
										className="p-2.5 flex items-center text-gray-600 rounded-lg transition-colors group hover:bg-gray-100"
									>
										{isDeleting === release._id ? (
											<div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
										) : (
											<Trash2
												className="text-red-500 hover:text-red-700"
												size={18}
											/>
										)}
									</motion.button>
									{expandedRelease === release._id ? (
										<ChevronUp className="h-5 w-5 text-gray-400" />
									) : (
										<ChevronDown className="h-5 w-5 text-gray-400" />
									)}
								</div>
							</div>
						</div>

						<AnimatePresence>
							{expandedRelease === release._id && (
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
												<span className="text-gray-600">{release._id}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Disc className="h-4 w-4 text-brand-light" /> Nombre:
												</span>
												<span className="text-gray-600">{release.name}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Tag className="h-4 w-4 text-brand-light" /> Label:
												</span>
												<span className="text-gray-600">{release.label}</span>
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
													<Disc className="h-4 w-4 text-brand-light" /> Tipo:
												</span>
												<span className="text-gray-600">{release.kind}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Globe className="h-4 w-4 text-brand-light" /> Países:
												</span>
												<span className="text-gray-600">
													{release.countries.join(', ')}
												</span>
											</p>
										</div>
										<div className="space-y-3">
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Users className="h-4 w-4 text-brand-light" />{' '}
													Artistas:
												</span>
												<span className="text-gray-600 flex flex-col gap-1">
													{release.artists.length > 0
														? release.artists.map(
																(artist: any, index: number) => (
																	<span
																		key={`${release._id}-artist-${index}`}
																		className="flex items-center gap-2"
																	>
																		<span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
																			{artist.kind === 'main'
																				? 'Principal'
																				: artist.kind === 'featuring'
																				? 'Featuring'
																				: artist.kind === 'remixer'
																				? 'Remixer'
																				: artist.kind}
																		</span>
																		<span>{artist.name}</span>
																	</span>
																)
														  )
														: 'No hay artistas'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Music className="h-4 w-4 text-brand-light" /> Pistas:
												</span>
												<span className="flex flex-col gap-1">
													{release.tracks.length > 0 ? (
														release.tracks.map((track: any, index: number) => (
															<span
																key={`${release._id}-track-${
																	track.id || index
																}`}
																className="flex items-center gap-2 text-gray-600"
															>
																<Music className="h-3 w-3 text-gray-400" />
																<span>{track.name}</span>
															</span>
														))
													) : (
														<span className="text-gray-400">No hay pistas</span>
													)}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Disc className="h-4 w-4 text-brand-light" /> Dolby
													Atmos:
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
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Globe className="h-4 w-4 text-brand-light" /> Auto
													detectar idioma:
												</span>
												<span className="text-gray-600">
													{release.auto_detect_language ? (
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
													<Barcode className="h-4 w-4 text-brand-light" />{' '}
													Generar EAN:
												</span>
												<span className="text-gray-600">
													{release.generate_ean ? (
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
													<Youtube className="h-4 w-4 text-brand-light" />{' '}
													YouTube declaration:
												</span>
												<span className="text-gray-600">
													{release.youtube_declaration ? (
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
													<Calendar className="h-4 w-4 text-brand-light" />{' '}
													Creado:
												</span>
												<span className="text-gray-600">
													{new Date(release.createdAt).toLocaleString()}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Calendar className="h-4 w-4 text-brand-light" />{' '}
													Actualizado:
												</span>
												<span className="text-gray-600">
													{new Date(release.updatedAt).toLocaleString()}
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

			{selectedRelease && (
				<UpdateReleaseModal
					release={
						{
							...selectedRelease,
							picture: selectedRelease.picture
								? { base64: selectedRelease.picture }
								: null,
							updatedAt: selectedRelease.updatedAt || new Date().toISOString(),
						} as ReleaseForModal
					}
					isOpen={isEditModalOpen}
					onClose={() => {
						setIsEditModalOpen(false);
						setSelectedRelease(null);
					}}
					onSave={handleSaveEdit}
				/>
			)}
		</div>
	);
};

export default Productos;
