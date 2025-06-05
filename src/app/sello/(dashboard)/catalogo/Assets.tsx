import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import TrackForm, { GenreData } from '@/components/CreateTrackModal';
import useSWR from 'swr';
import {
	ChevronDown,
	ChevronUp,
	Music,
	Pencil,
	Calendar,
	Users,
	Disc,
	CheckCircle,
	Trash2,
	Hash,
	Languages,
	Clock,
	FileMusic,
	Copyright,
	Share2,
} from 'lucide-react';
import UpdateTrackModal from '@/components/UpdateTrackModal';
import Pagination from '@/components/Pagination';
import { Track } from '@/types/track';
import SearchInput from '@/components/SearchInput';
import SortSelect from '@/components/SortSelect';

interface Release {
	_id: string;
	external_id: number;
	name: string;
	picture: {
		base64: string;
	};
}

interface TrackResponse {
	success: boolean;
	data: {
		tracks: Track[];
		pagination: {
			total: number;
			page: number;
			limit: number;
			totalPages: number;
		};
	};
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Assets = () => {
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [genres, setGenres] = useState<GenreData[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState('newest');
	const [releases, setReleases] = useState<Release[]>([]);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const { data, error, isLoading, mutate } = useSWR<TrackResponse>(
		`/api/admin/getAllTracks?page=${currentPage}${
			searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
		}&sort=${sortBy}`,
		fetcher
	);

	const tracks = data?.data?.tracks || [];
	const totalPages = data?.data?.pagination?.totalPages || 1;
	const totalItems = data?.data?.pagination?.total || 0;

	const sortOptions = [
		{ label: 'Más recientes', value: 'newest' },
		{ label: 'Más antiguos', value: 'oldest' },
	];

	useEffect(() => {
		const fetchData = async () => {
			fetch('/api/admin/getAllReleases')
				.then(res => res.json())
				.then(response => {
					if (response.success && response.data) {
						setReleases(response.data.releases);
					}
				})
				.catch(error => console.error('Error fetching releases:', error));
			// Fetch genres
			const genresRes = await fetch('/api/admin/getAllGenres');
			const genresData = await genresRes.json();
			if (genresData.success && Array.isArray(genresData.data)) {
				setGenres(genresData.data);
			}
		};
		fetchData();
	}, []);

	const toggleExpand = (trackId: string | undefined) => {
		if (!trackId) return;
		setExpandedTrack(expandedTrack === trackId ? null : trackId);
	};

	const handleEdit = (e: React.MouseEvent, track: Track) => {
		e.stopPropagation();
		setSelectedTrack(track);
		setIsEditModalOpen(true);
	};

	const handleDelete = async (e: React.MouseEvent, track: Track) => {
		e.stopPropagation();

		if (!track._id) {
			alert('Error: Track ID no encontrado');
			return;
		}

		if (!confirm(`¿Estás seguro de que deseas eliminar "${track.name}"?`)) {
			return;
		}

		setIsDeleting(track._id);

		try {
			const response = await fetch(`/api/admin/deleteSingle/${track._id}`, {
				method: 'DELETE',
			});

			const data = await response.json();

			if (response.ok) {
				mutate();
				setShowSuccessMessage(true);
				setTimeout(() => setShowSuccessMessage(false), 3000);
			} else {
				alert(data.message || 'Error al eliminar el track');
			}
		} catch (error) {
			console.error('Error deleting track:', error);
			alert('Error al eliminar el track');
		} finally {
			setIsDeleting(null);
		}
	};

	const handleSaveEdit = async (trackData: {
		order?: number;
		name: string;
		mixName: string;
		genre?: number;
		copyright_holder: string;
		file?: File;
	}) => {
		if (!selectedTrack?._id) {
			alert('Error: Track ID no encontrado');
			return;
		}

		try {
			const updatedTrack = {
				...selectedTrack,
				name: trackData.name,
				mix_name: trackData.mixName,
				genre: trackData.genre,
				copyright_holder: trackData.copyright_holder,
				resource: trackData.file,
			};

			let response;
			if (trackData.file) {
				const submitFormData = new FormData();
				submitFormData.append('file', trackData.file);
				const { resource, ...restData } = updatedTrack;
				submitFormData.append('data', JSON.stringify(restData));

				response = await fetch(`/api/admin/updateSingle/${selectedTrack._id}`, {
					method: 'PUT',
					body: submitFormData,
				});
			} else {
				response = await fetch(`/api/admin/updateSingle/${selectedTrack._id}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(updatedTrack),
				});
			}

			if (!response.ok) {
				throw new Error('Error al actualizar el track');
			}

			const data = await response.json();
			if (data.success) {
				mutate();
				setShowSuccessMessage(true);
				setTimeout(() => setShowSuccessMessage(false), 3000);
				setIsEditModalOpen(false);
				setSelectedTrack(null);
			} else {
				throw new Error(data.error || 'Error al actualizar el track');
			}
		} catch (error) {
			console.error('Error:', error);
			alert('Error al actualizar el track');
		}
	};

	const getReleaseName = (releaseId: string | undefined | null): string => {
		if (!releaseId) return 'No especificado';

		const release = releases.find(r => r.external_id === Number(releaseId));
		if (!release) return 'Release no encontrado';

		return release.name;
	};

	const handleCreateTrack = async (newTrack: Partial<Track>) => {
		try {
			let response;
			if (newTrack.resource instanceof File) {
				const submitFormData = new FormData();
				submitFormData.append('file', newTrack.resource);
				const { resource, ...restData } = newTrack;
				submitFormData.append('data', JSON.stringify(restData));

				response = await fetch(`/api/admin/createSingle`, {
					method: 'POST',
					body: submitFormData,
				});
			} else {
				response = await fetch(`/api/admin/createSingle`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(newTrack),
				});
			}
			if (!response.ok) {
				throw new Error('Error al actualizar el track');
			}

			const data = await response.json();
			if (data.success) {
				mutate();
				setShowSuccessMessage(true);
				setTimeout(() => setShowSuccessMessage(false), 3000);
			} else {
				throw new Error(data.error || 'Error al actualizar el track');
			}
		} catch (error) {
			console.error('Error:', error);
			alert('Error al actualizar el track');
		}
	};

	return (
		<div className="p-4 sm:p-6">
			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2 backdrop-blur-sm"
				>
					<CheckCircle size={18} />
					<span className="text-sm sm:text-base">
						Track actualizado exitosamente
					</span>
				</motion.div>
			)}

			{isEditModalOpen && selectedTrack ? (
				<TrackForm
					track={selectedTrack}
					genres={genres}
					onClose={() => {
						setIsEditModalOpen(false);
						setSelectedTrack(null);
					}}
					isAsset={true}
				/>
			) : (
				<>
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
						<h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
							Tracks
						</h1>
						<div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
							<div className="flex items-center gap-x-10 justify-center gap-4">
								<SearchInput value={searchQuery} onChange={setSearchQuery} />
								<SortSelect
									value={sortBy}
									onChange={setSortBy}
									options={sortOptions}
								/>
							</div>
						</div>
					</div>

					{tracks.length === 0 ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-gray-500 text-center py-12 sm:py-20 bg-white rounded-2xl shadow-sm border border-gray-100"
						>
							<Music className="h-16 w-16 sm:h-20 sm:w-20 mx-auto text-gray-300 mb-4 sm:mb-6" />
							<p className="text-xl sm:text-2xl font-semibold text-gray-700">
								No hay tracks disponibles
							</p>
							<p className="text-sm sm:text-base text-gray-400 mt-2 sm:mt-3">
								Agrega un nuevo track para comenzar
							</p>
						</motion.div>
					) : (
						<div className="space-y-4">
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-400">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Track
											</th>
											<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Release
											</th>
											<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Fecha
											</th>
											<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Acciones
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-300">
										{tracks.map((track: Track) => (
											<React.Fragment key={track._id}>
												<tr className="hover:bg-gray-50">
													<td className="px-4 sm:px-6 py-4">
														<div className="flex items-center gap-3">
															<div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
																<Music className="h-5 w-5 text-gray-400" />
															</div>
															<div className="min-w-0 flex-1">
																<h2 className="text-lg font-semibold text-gray-900 truncate">
																	{track.name}
																</h2>
																<div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
																	<FileMusic className="h-4 w-4 text-brand-light" />
																	<span className="truncate">
																		{getReleaseName(track.release)}
																	</span>
																</div>
															</div>
														</div>
													</td>
													<td className="px-4 sm:px-6 py-4">
														<div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
															{track.genre_name && (
																<div className="flex items-center gap-1">
																	<Disc className="h-4 w-4" />
																	<span>{track.genre_name}</span>
																</div>
															)}
															{track.language && (
																<div className="flex items-center gap-1">
																	<Languages className="h-4 w-4" />
																	<span>{track.language}</span>
																</div>
															)}
														</div>
													</td>
													<td className="px-4 sm:px-6 py-4">
														<div className="flex items-center gap-1 text-sm text-gray-500">
															<Calendar className="h-4 w-4" />
															<span>
																{track.createdAt
																	? new Date(
																			track.createdAt
																	  ).toLocaleDateString()
																	: 'No especificado'}
															</span>
														</div>
													</td>
													<td className="px-4 sm:px-6 py-4">
														<div className="flex items-center gap-2">
															<motion.button
																whileHover={{ scale: 1.05 }}
																whileTap={{ scale: 0.95 }}
																onClick={e => handleEdit(e, track)}
																className="p-2 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
															>
																<Pencil className="h-5 w-5 text-brand-light" />
															</motion.button>
															<motion.button
																whileHover={{ scale: 1.05 }}
																whileTap={{ scale: 0.95 }}
																onClick={e => handleDelete(e, track)}
																disabled={isDeleting === track._id}
																className="p-2 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
															>
																{isDeleting === track._id ? (
																	<div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
																) : (
																	<Trash2 className="h-5 w-5 text-red-500" />
																)}
															</motion.button>
															<motion.button
																whileHover={{ scale: 1.05 }}
																whileTap={{ scale: 0.95 }}
																onClick={() => toggleExpand(track._id)}
																className="p-2 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
															>
																{expandedTrack === track._id ? (
																	<ChevronUp className="h-5 w-5" />
																) : (
																	<ChevronDown className="h-5 w-5" />
																)}
															</motion.button>
														</div>
													</td>
												</tr>
												{expandedTrack === track._id && (
													<tr>
														<td
															colSpan={4}
															className="px-4 sm:px-6 py-4 bg-gray-50"
														>
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
															>
																<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
																	<div className="space-y-3">
																		<p className="flex items-start gap-2">
																			<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1 text-sm">
																				<Hash className="h-4 w-4 text-brand-light" />{' '}
																				ID:
																			</span>
																			<span className="text-gray-600 text-sm break-all">
																				{track._id}
																			</span>
																		</p>
																		<p className="flex items-start gap-2">
																			<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1 text-sm">
																				<Clock className="h-4 w-4 text-brand-light" />{' '}
																				Duración:
																			</span>
																			<span className="text-gray-600 text-sm">
																				{track.track_length ||
																					'No especificada'}
																			</span>
																		</p>
																		<p className="flex items-start gap-2">
																			<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1 text-sm">
																				<Copyright className="h-4 w-4 text-brand-light" />{' '}
																				Derechos:
																			</span>
																			<span className="text-gray-600 text-sm break-words">
																				{track.copyright_holder ||
																					'No especificados'}
																			</span>
																		</p>
																	</div>
																	<div className="space-y-3">
																		<p className="flex items-start gap-2">
																			<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1 text-sm">
																				<Share2 className="h-4 w-4 text-brand-light" />{' '}
																				ISRC:
																			</span>
																			<span className="text-gray-600 text-sm break-all">
																				{track.ISRC || 'No especificado'}
																			</span>
																		</p>
																		<p className="flex items-start gap-2">
																			<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1 text-sm">
																				<Languages className="h-4 w-4 text-brand-light" />{' '}
																				Idioma:
																			</span>
																			<span className="text-gray-600 text-sm">
																				{track.language || 'No especificado'}
																			</span>
																		</p>
																	</div>
																</div>

																{track.artists && track.artists.length > 0 && (
																	<div className="mt-4 pt-4 border-t border-gray-100">
																		<p className="font-medium text-gray-700 mb-3 flex items-center gap-2 text-sm">
																			<Users className="h-4 w-4 text-brand-light" />{' '}
																			Artistas
																		</p>
																		<div className="flex flex-wrap gap-2">
																			{track.artists.map(
																				(artist: any, index: number) => (
																					<span
																						key={`${track._id}-artist-${index}`}
																						className="bg-gray-200 text-sm text-gray-600 px-2 py-1 rounded-full"
																					>
																						{artist.name}
																					</span>
																				)
																			)}
																		</div>
																	</div>
																)}
															</motion.div>
														</td>
													</tr>
												)}
											</React.Fragment>
										))}
									</tbody>
								</table>
							</div>

							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								totalItems={totalItems}
								itemsPerPage={5}
								onPageChange={setCurrentPage}
								className="mt-4"
							/>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default Assets;
