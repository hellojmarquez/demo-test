import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	ChevronDown,
	ChevronUp,
	Music,
	Pencil,
	Calendar,
	Globe,
	Tag,
	Users,
	Disc,
	Youtube,
	CheckCircle,
	XCircle,
	Hash,
	Languages,
	Archive,
	Barcode,
	Clock,
	Mic,
	Volume2,
	FileMusic,
	Copyright,
	Share2,
	Headphones,
} from 'lucide-react';
import UpdateTrackModal from '@/components/UpdateTrackModal';

interface Artist {
	name: string;
}

interface Contributor {
	id: number;
	contributor: number;
	role: number;
	order: number;
}

interface Track {
	_id: string;
	name: string;
	mix_name: string;
	DA_ISRC: string;
	ISRC: string;
	__v: number;
	album_only: boolean;
	artists: { artist: number; kind: string; order: number }[];
	contributors: { contributor: number; role: number; order: number }[];
	copyright_holder: string;
	copyright_holder_year: string;
	createdAt: string;
	dolby_atmos_resource: string;
	explicit_content: boolean;
	generate_isrc: boolean;
	genre: number;
	label_share: string;
	language: string;
	order: number;
	publishers: { publisher: number; author: string; order: number }[];
	release: string;
	resource: string;
	sample_start: string;
	subgenre: number;
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
				`/api/admin/updateSingle/${updatedTrack._id}`,
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
		<div className="space-y-6">
			{showSuccessMessage && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2"
				>
					<CheckCircle size={18} />
					<span>Track actualizado exitosamente</span>
				</motion.div>
			)}
			{assets.length === 0 ? (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-gray-500 text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100"
				>
					<Music className="h-16 w-16 mx-auto text-gray-300 mb-4" />
					<p className="text-xl font-medium">No hay assets disponibles.</p>
					<p className="text-sm text-gray-400 mt-2">
						Agrega un nuevo track para comenzar.
					</p>
				</motion.div>
			) : (
				assets.map(track => (
					<motion.div
						key={track._id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
					>
						<div
							onClick={() => toggleExpand(track._id)}
							className="p-5 cursor-pointer flex items-center justify-between"
						>
							<div className="flex-1 flex items-center gap-5">
								<div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg shadow-sm">
									<Music className="h-8 w-8 text-gray-400" />
								</div>
								<div>
									<h2 className="text-xl font-semibold text-gray-900 mb-1">
										{track.name}
									</h2>
									<div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
										<Mic className="h-4 w-4 text-brand-light" />
										<span>Artista: {track.vocals}</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
										<Calendar className="h-3 w-3" />
										<span>
											Creado: {new Date(track.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={e => handleEdit(e, track)}
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
									<div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
										<div className="space-y-3">
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Hash className="h-4 w-4 text-brand-light" /> ID:
												</span>
												<span className="text-gray-600">{track._id}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<FileMusic className="h-4 w-4 text-brand-light" />{' '}
													Mix:
												</span>
												<span className="text-gray-600">{track.mix_name}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Tag className="h-4 w-4 text-brand-light" /> Género:
												</span>
												<span className="text-gray-600">
													{track.genre} / {track.subgenre}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Clock className="h-4 w-4 text-brand-light" />{' '}
													Duración:
												</span>
												<span className="text-gray-600">
													{track.track_lenght}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Languages className="h-4 w-4 text-brand-light" />{' '}
													Idioma:
												</span>
												<span className="text-gray-600">{track.language}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Mic className="h-4 w-4 text-brand-light" />{' '}
													Vocalista:
												</span>
												<span className="text-gray-600">{track.vocals}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Volume2 className="h-4 w-4 text-brand-light" />{' '}
													Explícito:
												</span>
												<span className="text-gray-600">
													{track.explicit_content ? (
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
													<Copyright className="h-4 w-4 text-brand-light" />{' '}
													Copyright:
												</span>
												<span className="text-gray-600">
													{track.copyright_holder} ©{' '}
													{track.copyright_holder_year}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Share2 className="h-4 w-4 text-brand-light" /> Label
													Share:
												</span>
												<span className="text-gray-600">
													{track.label_share}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Headphones className="h-4 w-4 text-brand-light" />{' '}
													Dolby Atmos:
												</span>
												<span className="text-gray-600">
													{track.dolby_atmos_resource}
												</span>
											</p>
										</div>
										<div className="space-y-3">
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Barcode className="h-4 w-4 text-brand-light" /> ISRC:
												</span>
												<span className="text-gray-600">{track.ISRC}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Barcode className="h-4 w-4 text-brand-light" /> DA
													ISRC:
												</span>
												<span className="text-gray-600">{track.DA_ISRC}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Archive className="h-4 w-4 text-brand-light" /> Album
													Only:
												</span>
												<span className="text-gray-600">
													{track.album_only ? (
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
													Generate ISRC:
												</span>
												<span className="text-gray-600">
													{track.generate_isrc ? (
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
													<FileMusic className="h-4 w-4 text-brand-light" />{' '}
													Resource:
												</span>
												<span className="text-gray-600">{track.resource}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Clock className="h-4 w-4 text-brand-light" /> Sample
													Start:
												</span>
												<span className="text-gray-600">
													{track.sample_start}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Tag className="h-4 w-4 text-brand-light" /> Order:
												</span>
												<span className="text-gray-600">
													{track.order || 'No especificado'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Disc className="h-4 w-4 text-brand-light" /> Release:
												</span>
												<span className="text-gray-600">
													{track.release || 'No especificado'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Users className="h-4 w-4 text-brand-light" />{' '}
													Artists:
												</span>
												<span className="text-gray-600">
													{track.artists
														.map(a => `Artist ID: ${a.artist}, Kind: ${a.kind}`)
														.join(', ')}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Users className="h-4 w-4 text-brand-light" />{' '}
													Contributors:
												</span>
												<span className="text-gray-600">
													{track.contributors
														.map(
															c =>
																`Contributor ID: ${c.contributor}, Role: ${c.role}`
														)
														.join(', ')}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Copyright className="h-4 w-4 text-brand-light" />{' '}
													Publishers:
												</span>
												<span className="text-gray-600">
													{track.publishers.length > 0
														? track.publishers
																.map(
																	p =>
																		`Publisher ID: ${p.publisher}, Author: ${p.author}`
																)
																.join(', ')
														: 'No especificados'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Calendar className="h-4 w-4 text-brand-light" />{' '}
													Creado:
												</span>
												<span className="text-gray-600">
													{new Date(track.createdAt).toLocaleString()}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700 min-w-[100px] flex items-center gap-1">
													<Calendar className="h-4 w-4 text-brand-light" />{' '}
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
