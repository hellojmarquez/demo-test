import React, { useEffect, useState } from 'react';

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

	useEffect(() => {
		fetch('/api/admin/getAllTracks')
			.then(res => res.json())
			.then(response => {
				console.log(response.singleTracks);
				setAssets(response.singleTracks as Track[]); // <- Aquí seteas los tracks
			})
			.catch(error => console.error('Error fetching tracks:', error));
	}, []);

	return (
		<div className="space-y-6">
			{assets.length === 0 ? (
				<p>No hay assets disponibles.</p>
			) : (
				assets.map(track => (
					<div
						key={track._id}
						className="p-4 border rounded-lg shadow-md space-y-2 bg-white"
					>
						<h2 className="text-xl font-semibold">{track.name}</h2>
						<p className="text-sm text-gray-600">
							<span className="font-bold">Mix:</span> {track.mix_name}
						</p>
						<p className="text-sm text-gray-600">
							<span className="font-bold">Género:</span> {track.genre} /{' '}
							{track.subgenre}
						</p>
						<p className="text-sm text-gray-600">
							<span className="font-bold">Duración:</span> {track.track_lenght}
						</p>
						<p className="text-sm text-gray-600">
							<span className="font-bold">Idioma:</span> {track.language}
						</p>
						<p className="text-sm text-gray-600">
							<span className="font-bold">Vocalista:</span> {track.vocals}
						</p>
						<p className="text-sm text-gray-600">
							<span className="font-bold">Explícito:</span>{' '}
							{track.explicit_content ? 'Sí' : 'No'}
						</p>
						<p className="text-sm text-gray-600">
							<span className="font-bold">Copyright:</span>{' '}
							{track.copyright_holder} © {track.copyright_holder_year}
						</p>
						<p className="text-xs text-gray-400">
							<span className="font-semibold">Creado:</span>{' '}
							{new Date(track.createdAt).toLocaleDateString()}
						</p>
					</div>
				))
			)}
		</div>
	);
};

export default Assets;
