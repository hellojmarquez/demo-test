import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Music, Pencil } from 'lucide-react';
import UpdateTrackModal from '@/components/UpdateTrackModal';

interface Artist {
	name: string;
}

interface Contributor {
	name: string;
}

interface Track {
	_id: string;
	name: string;
	mix_name: string;
	DA_ISRC: string;
	ISRC: string;
	__v: number;
	album_only: boolean;
	artists: Artist[];
	contributors: Contributor[];
	copyright_holder: string;
	copyright_holder_year: string;
	createdAt: string;
	dolby_atmos_resource: string;
	explicit_content: boolean;
	generate_isrc: boolean;
	genre: string;
	label_share: string;
	language: string;
	order: number | null;
	publishers: any[];
	release: string | null;
	resource: string;
	sample_start: string;
	subgenre: string;
	track_lenght: string;
	updatedAt: string;
	vocals: string;
}

const Assets = () => {
	const [assets, setAssets] = useState<Track[]>([]);
	const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
	const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);

	useEffect(() => {
		fetch('/api/admin/getAllTracks')
			.then(res => res.json())
			.then(response => {
				console.log(response.singleTracks);
				setAssets(response.singleTracks as Track[]);
			})
			.catch(error => console.error('Error fetching tracks:', error));
	}, []);

	const toggleExpand = (trackId: string) => {
		setExpandedTrack(expandedTrack === trackId ? null : trackId);
	};

	const handleEdit = (e: React.MouseEvent, track: Track) => {
		e.stopPropagation();
		setSelectedTrack(track);
		setIsEditModalOpen(true);
	};

	const handleSaveEdit = async (updatedTrack: Track) => {
		try {
			const response = await fetch(
				`/api/admin/updateTrack/${updatedTrack._id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(updatedTrack),
				}
			);

			if (response.ok) {
				setAssets(prev =>
					prev.map(track =>
						track._id === updatedTrack._id ? updatedTrack : track
					)
				);
				setIsEditModalOpen(false);
				setSelectedTrack(null);
				setShowSuccessMessage(true);
				setTimeout(() => setShowSuccessMessage(false), 3000);
			} else {
				console.error('Error updating track');
			}
		} catch (error) {
			console.error('Error updating track:', error);
		}
	};

	return (
		<div className="space-y-4">
			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50"
				>
					Track actualizado exitosamente
				</motion.div>
			)}
			{assets.length === 0 ? (
				<p>No hay assets disponibles.</p>
			) : (
				assets.map(track => (
					<motion.div
						key={track._id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
					>
						<div
							onClick={() => toggleExpand(track._id)}
							className="p-4 cursor-pointer flex items-center justify-between"
						>
							<div className="flex-1 flex items-center gap-3">
								<Music className="h-5 w-5 text-brand-dark" />
								<div>
									<h2 className="text-lg font-medium text-gray-900">
										{track.name}
									</h2>
									<p className="text-sm text-gray-500">
										Artista: {track.vocals}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={e => handleEdit(e, track)}
									className="p-2 flex gap-x-2 items-center text-gray-600 rounded-md transition-colors group hover:text-brand-dark"
								>
									<Pencil
										className="text-brand-light group-hover:text-brand-dark"
										size={18}
									/>
									<span className="text-brand-light group-hover:text-brand-dark">
										Editar
									</span>
								</motion.button>
								{expandedTrack === track._id ? (
									<ChevronUp className="h-5 w-5 text-gray-400" />
								) : (
									<ChevronDown className="h-5 w-5 text-gray-400" />
								)}
							</div>
						</div>

						<AnimatePresence>
							{expandedTrack === track._id && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: 'auto', opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.2 }}
									className="border-t border-gray-100"
								>
									<div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
										<div className="space-y-2">
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">ID:</span>
												<span className="text-gray-600">{track._id}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">Mix:</span>
												<span className="text-gray-600">{track.mix_name}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Género:
												</span>
												<span className="text-gray-600">
													{track.genre} / {track.subgenre}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Duración:
												</span>
												<span className="text-gray-600">
													{track.track_lenght}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Idioma:
												</span>
												<span className="text-gray-600">{track.language}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Vocalista:
												</span>
												<span className="text-gray-600">{track.vocals}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Explícito:
												</span>
												<span className="text-gray-600">
													{track.explicit_content ? 'Sí' : 'No'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Copyright:
												</span>
												<span className="text-gray-600">
													{track.copyright_holder} ©{' '}
													{track.copyright_holder_year}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Label Share:
												</span>
												<span className="text-gray-600">
													{track.label_share}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Dolby Atmos:
												</span>
												<span className="text-gray-600">
													{track.dolby_atmos_resource}
												</span>
											</p>
										</div>
										<div className="space-y-2">
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">ISRC:</span>
												<span className="text-gray-600">{track.ISRC}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													DA ISRC:
												</span>
												<span className="text-gray-600">{track.DA_ISRC}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Album Only:
												</span>
												<span className="text-gray-600">
													{track.album_only ? 'Sí' : 'No'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Generate ISRC:
												</span>
												<span className="text-gray-600">
													{track.generate_isrc ? 'Sí' : 'No'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Resource:
												</span>
												<span className="text-gray-600">{track.resource}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Sample Start:
												</span>
												<span className="text-gray-600">
													{track.sample_start}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Order:
												</span>
												<span className="text-gray-600">
													{track.order || 'No especificado'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Release:
												</span>
												<span className="text-gray-600">
													{track.release || 'No especificado'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Artists:
												</span>
												<span className="text-gray-600">
													{track.artists.map(a => a.name).join(', ')}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Contributors:
												</span>
												<span className="text-gray-600">
													{track.contributors.map(c => c.name).join(', ')}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Publishers:
												</span>
												<span className="text-gray-600">
													{track.publishers.length > 0
														? track.publishers.join(', ')
														: 'No especificados'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Creado:
												</span>
												<span className="text-gray-600">
													{new Date(track.createdAt).toLocaleString()}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Actualizado:
												</span>
												<span className="text-gray-600">
													{new Date(track.updatedAt).toLocaleString()}
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

			{selectedTrack && (
				<UpdateTrackModal
					track={selectedTrack}
					isOpen={isEditModalOpen}
					onClose={() => {
						setIsEditModalOpen(false);
						setSelectedTrack(null);
					}}
					onSave={handleSaveEdit}
				/>
			)}
		</div>
	);
};

export default Assets;
