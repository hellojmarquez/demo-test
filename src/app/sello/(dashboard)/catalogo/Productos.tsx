import React, { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import EditReleaseModal from '@/components/EditReleaseModal';
import { motion, AnimatePresence } from 'framer-motion';

// Tipamos el objeto de release
interface Release {
	_id: string;
	__v: number;
	artists: any[]; // Puedes tiparlo mejor si sabes qué estructura tiene
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
	picture: {
		base64: string;
	} | null;
	tracks: any[]; // Igual aquí, si quieres lo tipamos más estricto
	youtube_declaration: boolean;
}

const Productos: React.FC = () => {
	const [releases, setReleases] = useState<Release[]>([]);
	const [expandedRelease, setExpandedRelease] = useState<string | null>(null);
	const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	useEffect(() => {
		fetch('/api/admin/getAllReleases')
			.then(res => res.json())
			.then(response => {
				console.log(response.data);
				setReleases(response.data as Release[]);
			})
			.catch(error => console.error('Error fetching releases:', error));
	}, []);

	const toggleExpand = (id: string) => {
		setExpandedRelease(prev => (prev === id ? null : id));
	};

	const handleEdit = (e: React.MouseEvent, release: Release) => {
		e.stopPropagation();
		setSelectedRelease(release);
		setIsEditModalOpen(true);
	};

	const handleSaveEdit = async (updatedRelease: Release) => {
		try {
			const response = await fetch(
				`/api/admin/updateRelease/${updatedRelease._id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(updatedRelease),
				}
			);

			if (response.ok) {
				setReleases(prev =>
					prev.map(release =>
						release._id === updatedRelease._id ? updatedRelease : release
					)
				);
				setIsEditModalOpen(false);
				setSelectedRelease(null);
			} else {
				console.error('Error updating release');
			}
		} catch (error) {
			console.error('Error updating release:', error);
		}
	};

	return (
		<div className="space-y-4">
			{releases.length === 0 ? (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-gray-500 text-center py-8"
				>
					No hay lanzamientos disponibles.
				</motion.p>
			) : (
				releases.map(release => (
					<motion.div
						key={release._id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
					>
						<div
							className="p-4 cursor-pointer"
							onClick={() => toggleExpand(release._id)}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									{release.picture && release.picture.base64 ? (
										<motion.img
											whileHover={{ scale: 1.05 }}
											transition={{ duration: 0.2 }}
											src={`data:image/jpeg;base64,${release.picture.base64}`}
											alt={release.name}
											className="w-16 h-16 object-cover rounded-lg"
										/>
									) : (
										<div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-lg">
											<span className="text-gray-400 text-xs">Sin imagen</span>
										</div>
									)}
									<div>
										<h2 className="text-lg font-medium text-gray-900">
											{release.name}
										</h2>
										<p className="text-sm text-gray-500">
											Label: {release.label}
										</p>
										<p className="text-xs text-gray-400">
											Creado: {new Date(release.createdAt).toLocaleDateString()}
										</p>
									</div>
								</div>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={e => handleEdit(e, release)}
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
									<div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
										<div className="space-y-2">
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">ID:</span>
												<span className="text-gray-600">{release._id}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Nombre:
												</span>
												<span className="text-gray-600">{release.name}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Label:
												</span>
												<span className="text-gray-600">{release.label}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Idioma:
												</span>
												<span className="text-gray-600">
													{release.language}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">Tipo:</span>
												<span className="text-gray-600">{release.kind}</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Países:
												</span>
												<span className="text-gray-600">
													{release.countries.join(', ')}
												</span>
											</p>
										</div>
										<div className="space-y-2">
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Artistas:
												</span>
												<span className="text-gray-600">
													{release.artists.length > 0
														? JSON.stringify(release.artists)
														: 'No hay artistas'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Pistas:
												</span>
												<span className="text-gray-600">
													{release.tracks.length > 0
														? JSON.stringify(release.tracks)
														: 'No hay pistas'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Dolby Atmos:
												</span>
												<span className="text-gray-600">
													{release.dolby_atmos ? 'Sí' : 'No'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Backcatalog:
												</span>
												<span className="text-gray-600">
													{release.backcatalog ? 'Sí' : 'No'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Auto detectar idioma:
												</span>
												<span className="text-gray-600">
													{release.auto_detect_language ? 'Sí' : 'No'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Generar EAN:
												</span>
												<span className="text-gray-600">
													{release.generate_ean ? 'Sí' : 'No'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													YouTube:
												</span>
												<span className="text-gray-600">
													{release.youtube_declaration ? 'Sí' : 'No'}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
													Creado:
												</span>
												<span className="text-gray-600">
													{new Date(release.createdAt).toLocaleString()}
												</span>
											</p>
											<p className="flex items-center gap-2">
												<span className="font-medium text-gray-700">
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
				<EditReleaseModal
					release={{
						...selectedRelease,
						updatedAt: selectedRelease.updatedAt || new Date().toISOString(),
					}}
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
