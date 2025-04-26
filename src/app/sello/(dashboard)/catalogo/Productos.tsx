import React, { useEffect, useState } from 'react';

// Tipamos el objeto de release
interface Release {
	_id: string;
	__v: number;
	artists: any[]; // Puedes tiparlo mejor si sabes qué estructura tiene
	auto_detect_language: boolean;
	backcatalog: boolean;
	countries: string[];
	createdAt: string;
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
}

const Productos: React.FC = () => {
	const [releases, setReleases] = useState<Release[]>([]);
	const [expandedRelease, setExpandedRelease] = useState<string | null>(null); // ID expandido

	useEffect(() => {
		fetch('/api/admin/getAllReleases')
			.then(res => res.json())
			.then(response => {
				setReleases(response.data as Release[]);
			})
			.catch(error => console.error('Error fetching releases:', error));
	}, []);

	const toggleExpand = (id: string) => {
		setExpandedRelease(prev => (prev === id ? null : id));
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
								<p className="text-sm text-gray-600">Label: {release.label}</p>
								<p className="text-sm text-gray-500">
									Creado: {new Date(release.createdAt).toLocaleDateString()}
								</p>
							</div>
						</div>

						{expandedRelease === release._id && (
							<div className="mt-4 text-sm text-gray-700 space-y-2">
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
									<span className="font-semibold">Dolby Atmos:</span>{' '}
									{release.dolby_atmos ? 'Sí' : 'No'}
								</p>
								<p>
									<span className="font-semibold">Backcatalog:</span>{' '}
									{release.backcatalog ? 'Sí' : 'No'}
								</p>
							</div>
						)}
					</div>
				))
			)}
		</div>
	);
};

export default Productos;
