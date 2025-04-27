import React, { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import EditReleaseModal from '@/components/EditReleaseModal';

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
		<div className="space-y-6">
			{releases.length === 0 ? (
				<p>No hay lanzamientos disponibles.</p>
			) : (
				releases.map(release => (
					<div
						key={release._id}
						className="p-4 border rounded-lg shadow cursor-pointer transition-all duration-300"
						onClick={() => toggleExpand(release._id)}
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								{release.picture && release.picture.base64 ? (
									<img
										src={`data:image/jpeg;base64,${release.picture.base64}`}
										alt={release.name}
										className="w-16 h-16 object-cover rounded-md"
									/>
								) : (
									<div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-md">
										<span className="text-gray-500 text-xs">Sin imagen</span>
									</div>
								)}
								<div>
									<h2 className="text-lg font-bold">{release.name}</h2>
									<p className="text-sm text-gray-600">
										Label: {release.label}
									</p>
									<p className="text-sm text-gray-500">
										Creado: {new Date(release.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
							<button
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
							</button>
						</div>

						{expandedRelease === release._id && (
							<div className="mt-4 text-sm text-gray-700 space-y-2">
								<p>
									<span className="font-semibold">ID:</span> {release._id}
								</p>
								<p>
									<span className="font-semibold">Nombre:</span> {release.name}
								</p>
								<p>
									<span className="font-semibold">Label:</span> {release.label}
								</p>
								<p>
									<span className="font-semibold">Idioma:</span>{' '}
									{release.language}
								</p>
								<p>
									<span className="font-semibold">Tipo:</span> {release.kind}
								</p>
								<p>
									<span className="font-semibold">Países:</span>{' '}
									{release.countries.join(', ')}
								</p>
								<p>
									<span className="font-semibold">Artistas:</span>{' '}
									{release.artists.length > 0
										? JSON.stringify(release.artists)
										: 'No hay artistas'}
								</p>
								<p>
									<span className="font-semibold">Pistas:</span>{' '}
									{release.tracks.length > 0
										? JSON.stringify(release.tracks)
										: 'No hay pistas'}
								</p>
								<p>
									<span className="font-semibold">Dolby Atmos:</span>{' '}
									{release.dolby_atmos ? 'Sí' : 'No'}
								</p>
								<p>
									<span className="font-semibold">Backcatalog:</span>{' '}
									{release.backcatalog ? 'Sí' : 'No'}
								</p>
								<p>
									<span className="font-semibold">
										Detectar idioma automáticamente:
									</span>{' '}
									{release.auto_detect_language ? 'Sí' : 'No'}
								</p>
								<p>
									<span className="font-semibold">Generar EAN:</span>{' '}
									{release.generate_ean ? 'Sí' : 'No'}
								</p>
								<p>
									<span className="font-semibold">Declaración de YouTube:</span>{' '}
									{release.youtube_declaration ? 'Sí' : 'No'}
								</p>
								<p>
									<span className="font-semibold">Creado:</span>{' '}
									{new Date(release.createdAt).toLocaleString()}
								</p>
								<p>
									<span className="font-semibold">Actualizado:</span>{' '}
									{new Date(release.updatedAt).toLocaleString()}
								</p>
							</div>
						)}
					</div>
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
