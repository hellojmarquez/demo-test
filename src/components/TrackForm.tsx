import React, { useState, useEffect } from 'react';
import { Track } from '../types/track';

interface Artist {
	artist: number;
	kind: string;
	order: number;
	name: string;
}

interface Genre {
	id: number;
	name: string;
	subgenres?: Subgenre[];
}

interface Subgenre {
	id: number;
	name: string;
}

interface TrackFormProps {
	track: Partial<Track> | undefined;
	onSave: (track: Partial<Track>) => Promise<void>;
	onTrackChange: (track: Partial<Track>) => void;
}

const TrackForm: React.FC<TrackFormProps> = ({
	track,
	onSave,
	onTrackChange,
}) => {
	console.log('TrackForm rendered with track:', track);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [genres, setGenres] = useState<Genre[]>([]);
	const [subgenres, setSubgenres] = useState<Subgenre[]>([]);

	useEffect(() => {
		// Actualizar subgéneros cuando cambia el género
		if (track?.genre) {
			const selectedGenre = genres.find(g => g.id === track.genre);
			if (selectedGenre?.subgenres) {
				setSubgenres(selectedGenre.subgenres);
			}
		}
	}, [track?.genre, genres]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log('handleSubmit called with track:', track);
		setIsSubmitting(true);
		setErrors({});

		try {
			if (track) {
				await onSave(track);
			}
		} catch (error) {
			console.error('Error saving track:', error);
			setErrors({ submit: 'Error saving track' });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target;
		const newValue =
			type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
		console.log('handleChange called with:', { name, value: newValue });

		if (track) {
			if (name === 'genre') {
				const genreId = parseInt(value);
				const selectedGenre = genres.find(g => g.id === genreId);
				onTrackChange({
					...track,
					genre: genreId,
					genre_name: selectedGenre?.name || '',
					subgenre: 0,
					subgenre_name: '',
				});
			} else if (name === 'subgenre') {
				const subgenreId = parseInt(value);
				const selectedSubgenre = subgenres.find(s => s.id === subgenreId);
				onTrackChange({
					...track,
					subgenre: subgenreId,
					subgenre_name: selectedSubgenre?.name || '',
				});
			} else {
				onTrackChange({
					...track,
					[name]: newValue,
				});
			}
		}
	};

	const handleArtistChange = (
		index: number,
		field: keyof Artist,
		value: string
	) => {
		console.log('handleArtistChange called with:', { index, field, value });
		if (track && track.artists) {
			const updatedArtists = [...track.artists];
			updatedArtists[index] = {
				...updatedArtists[index],
				[field]: value,
			};

			onTrackChange({
				...track,
				artists: updatedArtists,
			});
		}
	};

	const addArtist = () => {
		console.log('addArtist called');
		if (track) {
			onTrackChange({
				...track,
				artists: [
					...(track.artists || []),
					{ artist: 0, kind: 'main', order: 0, name: '' },
				],
			});
		}
	};

	const removeArtist = (index: number) => {
		console.log('removeArtist called with index:', index);
		if (track && track.artists) {
			const updatedArtists = [...track.artists];
			updatedArtists.splice(index, 1);
			onTrackChange({
				...track,
				artists: updatedArtists,
			});
		}
	};

	return (
		<div className="bg-white rounded-lg p-8 w-full">
			<h2 className="text-2xl font-bold mb-6">
				{track?._id ? 'Edit Track' : 'Add New Track'}
			</h2>
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Nombre
						</label>
						<input
							type="text"
							name="name"
							value={track?.name || ''}
							onChange={handleChange}
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Mix Name
						</label>
						<input
							type="text"
							name="mix_name"
							value={track?.mix_name || ''}
							onChange={handleChange}
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							ISRC
						</label>
						<input
							type="text"
							name="ISRC"
							value={track?.ISRC || ''}
							onChange={handleChange}
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							DA ISRC
						</label>
						<input
							type="text"
							name="DA_ISRC"
							value={track?.DA_ISRC || ''}
							onChange={handleChange}
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Género
						</label>
						<select
							name="genre"
							value={track?.genre || ''}
							onChange={handleChange}
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
						>
							<option value="">Seleccionar género</option>
							{genres.map(genre => (
								<option key={genre.id} value={genre.id}>
									{genre.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Subgénero
						</label>
						<select
							name="subgenre"
							value={track?.subgenre}
							onChange={handleChange}
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
							disabled={!track?.genre}
						>
							<option value="">Seleccionar subgénero</option>
							{subgenres.map(subgenre => (
								<option key={subgenre.id} value={subgenre.id}>
									{subgenre.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Copyright Holder
						</label>
						<input
							type="text"
							name="copyright_holder"
							value={track?.copyright_holder || ''}
							onChange={handleChange}
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Copyright Year
						</label>
						<input
							type="text"
							name="copyright_holder_year"
							value={track?.copyright_holder_year || ''}
							onChange={handleChange}
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Duración
						</label>
						<input
							type="text"
							name="track_lenght"
							value={track?.track_lenght || ''}
							onChange={handleChange}
							placeholder="00:00:00"
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Dolby Atmos Resource
						</label>
						<input
							type="text"
							name="dolby_atmos_resource"
							value={track?.dolby_atmos_resource || ''}
							onChange={handleChange}
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
						/>
					</div>
				</div>

				<div className="space-y-4">
					<label className="block text-sm font-medium text-gray-700">
						Artistas
					</label>
					<div className="space-y-2">
						{(track?.artists || []).map((artist, index) => (
							<div key={index} className="flex items-center gap-2">
								<input
									type="text"
									value={artist.name}
									onChange={e =>
										handleArtistChange(index, 'name', e.target.value)
									}
									className="flex-1 px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
									placeholder="Nombre del artista"
								/>
								<select
									value={artist.kind}
									onChange={e =>
										handleArtistChange(index, 'kind', e.target.value)
									}
									className="px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
								>
									<option value="main">Principal</option>
									<option value="featuring">Invitado</option>
								</select>
								<button
									type="button"
									onClick={() => removeArtist(index)}
									className="p-2 text-red-600 hover:text-red-800"
								>
									Eliminar
								</button>
							</div>
						))}
						<button
							type="button"
							onClick={addArtist}
							className="text-brand-light hover:text-brand-dark"
						>
							+ Agregar Artista
						</button>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<div className="flex items-center">
						<input
							type="checkbox"
							name="album_only"
							checked={track?.album_only || false}
							onChange={handleChange}
							className="h-4 w-4 text-brand-light focus:ring-brand-light border-gray-300 rounded"
						/>
						<label className="ml-2 block text-sm text-gray-700">
							Album Only
						</label>
					</div>

					<div className="flex items-center">
						<input
							type="checkbox"
							name="explicit_content"
							checked={track?.explicit_content || false}
							onChange={handleChange}
							className="h-4 w-4 text-brand-light focus:ring-brand-light border-gray-300 rounded"
						/>
						<label className="ml-2 block text-sm text-gray-700">
							Contenido Explícito
						</label>
					</div>

					<div className="flex items-center">
						<input
							type="checkbox"
							name="generate_isrc"
							checked={track?.generate_isrc || false}
							onChange={handleChange}
							className="h-4 w-4 text-brand-light focus:ring-brand-light border-gray-300 rounded"
						/>
						<label className="ml-2 block text-sm text-gray-700">
							Generar ISRC
						</label>
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={() => onSave({})}
						className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="px-4 py-2 text-sm font-medium text-white bg-brand-light hover:bg-brand-dark rounded-md disabled:opacity-50"
					>
						{isSubmitting ? 'Guardando...' : 'Guardar'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default TrackForm;
