import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Upload, XCircle } from 'lucide-react';
import { Track } from '@/types/track';
import Cleave from 'cleave.js/react';
import 'cleave.js/dist/addons/cleave-phone.us';
import Select, { SingleValue } from 'react-select';

interface Artist {
	_id: string;
	external_id: string;
	name: string;
	role: string;
}

interface Contributor {
	contributor: number;
	name: string;
	role: number;
	order: number;
	role_name: string;
}

interface Publisher {
	external_id: number;
	name: string;
	role: string;
}

interface Role {
	id: number;
	name: string;
}

interface Release {
	_id: string;
	name: string;
	picture: {
		base64: string;
	};
}

interface Genre {
	id: number;
	name: string;
	subgenres: Subgenre[];
}

interface Subgenre {
	id: number;
	name: string;
}

interface TrackContributor {
	external_id: number;
	name: string;
	role: number;
	order: number;
}

interface TrackFormProps {
	track: Track | null;
	onSave: (trackData: {
		order?: number;
		name: string;
		mixName: string;
		genre?: number;
		copyright_holder: string;
		file?: File;
	}) => Promise<void>;
}

interface GenreData {
	id: number;
	name: string;
	subgenres: Array<{
		id: number;
		name: string;
	}>;
}

interface SubgenreOption {
	value: number;
	label: string;
}

const TrackForm: React.FC<TrackFormProps> = ({
	track,
	onSave,
}: TrackFormProps): JSX.Element => {
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		title: track?.name || '',
		mixName: track?.mix_name || '',
		genre: typeof track?.genre === 'number' ? track.genre : track?.genre || 0,
		subgenre:
			typeof track?.subgenre === 'number'
				? track.subgenre
				: track?.subgenre || 0,
		ISRC: track?.ISRC || '',
		generate_isrc: track?.generate_isrc ?? true,
		DA_ISRC: track?.DA_ISRC || '',
		explicit_content: track?.explicit_content ?? false,
		album_only: track?.album_only ?? false,
		track_lenght: track?.track_lenght || '',
		copyright_holder: track?.copyright_holder || '',
		file: null as File | null,
	});

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value, type } = e.target;
		setFormData(prev => ({
			...prev,
			[name]:
				type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			await onSave({
				name: formData.title,
				mixName: formData.mixName,
				genre: formData.genre,
				copyright_holder: formData.copyright_holder,
				file: formData.file || undefined,
			});
		} catch (error) {
			console.error('Error saving track:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-lg p-6">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-lg font-medium text-gray-900">
					{track ? 'Editar Track' : 'Nuevo Track'}
				</h3>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700">
						Título
					</label>
					<input
						type="text"
						name="title"
						value={formData.title}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700">
						Mix Name
					</label>
					<input
						type="text"
						name="mixName"
						value={formData.mixName}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700">
						Copyright Holder
					</label>
					<input
						type="text"
						name="copyright_holder"
						value={formData.copyright_holder}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700">
						Archivo WAV
					</label>
					<input
						type="file"
						accept=".wav"
						onChange={e => {
							const file = e.target.files?.[0];
							if (file) {
								setFormData(prev => ({ ...prev, file }));
							}
						}}
						className="mt-1 block w-full"
					/>
				</div>

				<div className="flex justify-end gap-3 mt-6">
					<button
						type="submit"
						disabled={isLoading}
						className="px-4 py-2 text-sm font-medium text-white bg-brand-light hover:bg-brand-dark rounded-md disabled:opacity-50"
					>
						{isLoading
							? 'Guardando...'
							: track
							? 'Guardar cambios'
							: 'Crear track'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default TrackForm;
