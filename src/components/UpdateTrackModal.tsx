import React, { useState } from 'react';
import { X, Save, XCircle, Plus, Trash2 } from 'lucide-react';

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
	publishers: string[];
	release: string | null;
	resource: string;
	sample_start: string;
	subgenre: string;
	track_lenght: string;
	updatedAt: string;
	vocals: string;
}

interface UpdateTrackModalProps {
	track: Track;
	isOpen: boolean;
	onClose: () => void;
	onSave: (updatedTrack: Track) => void;
}

const UpdateTrackModal: React.FC<UpdateTrackModalProps> = ({
	track,
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState<Track>(track);
	const [isLoading, setIsLoading] = useState(false);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value, type } = e.target;
		setFormData(prev => ({
			...prev,
			[name]:
				type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
		}));
	};

	const handleArrayChange = (
		arrayName: 'artists' | 'contributors' | 'publishers',
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newArray = [...prev[arrayName]];
			if (arrayName === 'publishers') {
				newArray[index] = value as string;
			} else {
				const currentItem = newArray[index] as Artist | Contributor;
				newArray[index] = {
					...currentItem,
					[field]: value,
				} as Artist | Contributor;
			}
			return {
				...prev,
				[arrayName]: newArray,
			};
		});
	};

	const addArrayItem = (
		arrayName: 'artists' | 'contributors' | 'publishers'
	) => {
		setFormData(prev => {
			const newItem =
				arrayName === 'contributors'
					? { id: 0, contributor: 1, role: 22, order: 2 }
					: arrayName === 'artists'
					? { name: '' }
					: '';
			return {
				...prev,
				[arrayName]: [...prev[arrayName], newItem],
			};
		});
	};

	const removeArrayItem = (
		arrayName: 'artists' | 'contributors' | 'publishers',
		index: number
	) => {
		setFormData(prev => ({
			...prev,
			[arrayName]: prev[arrayName].filter((_, i) => i !== index),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			await onSave(formData);
		} finally {
			setIsLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">Editar Track</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full"
					>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Nombre
							</label>
							<input
								type="text"
								name="name"
								value={formData.name}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Mix Name
							</label>
							<input
								type="text"
								name="mix_name"
								value={formData.mix_name}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								ISRC
							</label>
							<input
								type="text"
								name="ISRC"
								value={formData.ISRC}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								DA ISRC
							</label>
							<input
								type="text"
								name="DA_ISRC"
								value={formData.DA_ISRC}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Género
							</label>
							<input
								type="text"
								name="genre"
								value={formData.genre}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Subgénero
							</label>
							<input
								type="text"
								name="subgenre"
								value={formData.subgenre}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Idioma
							</label>
							<select
								name="language"
								value={formData.language}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							>
								<option value="ES">Español</option>
								<option value="EN">English</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Duración
							</label>
							<input
								type="text"
								name="track_lenght"
								value={formData.track_lenght}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Vocalista
							</label>
							<input
								type="text"
								name="vocals"
								value={formData.vocals}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
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
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Copyright Year
							</label>
							<input
								type="text"
								name="copyright_holder_year"
								value={formData.copyright_holder_year}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Label Share
							</label>
							<input
								type="text"
								name="label_share"
								value={formData.label_share}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Dolby Atmos Resource
							</label>
							<input
								type="text"
								name="dolby_atmos_resource"
								value={formData.dolby_atmos_resource}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Resource
							</label>
							<input
								type="text"
								name="resource"
								value={formData.resource}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Sample Start
							</label>
							<input
								type="text"
								name="sample_start"
								value={formData.sample_start}
								onChange={handleChange}
								className="mt-1 block w-full border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div className="flex items-center">
							<input
								type="checkbox"
								name="album_only"
								checked={formData.album_only}
								onChange={handleChange}
								className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
							/>
							<label className="ml-2 block text-sm text-gray-700">
								Album Only
							</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								name="explicit_content"
								checked={formData.explicit_content}
								onChange={handleChange}
								className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
							/>
							<label className="ml-2 block text-sm text-gray-700">
								Contenido Explícito
							</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								name="generate_isrc"
								checked={formData.generate_isrc}
								onChange={handleChange}
								className="h-4 w-4 text-brand-dark focus:ring-brand-dark border-gray-300 rounded"
							/>
							<label className="ml-2 block text-sm text-gray-700">
								Generar ISRC
							</label>
						</div>
					</div>

					<div className="text-sm text-gray-500 mt-4">
						<p>Creado: {new Date(formData.createdAt).toLocaleString()}</p>
						<p>Actualizado: {new Date(formData.updatedAt).toLocaleString()}</p>
					</div>

					{/* Artists Section */}
					<div className="space-y-4">
						<div className="flex justify-between items-center">
							<h3 className="text-lg font-medium text-gray-900">Artistas</h3>
							<button
								type="button"
								onClick={() => addArrayItem('artists')}
								className="p-2 text-brand-light hover:text-brand-dark rounded-full"
							>
								<Plus size={20} />
							</button>
						</div>
						<div className="space-y-4">
							{formData.artists.map((artist, index) => (
								<div key={index} className="flex items-center gap-4">
									<input
										type="text"
										value={artist.name}
										onChange={e =>
											handleArrayChange(
												'artists',
												index,
												'name',
												e.target.value
											)
										}
										className="flex-1 border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
										placeholder="Nombre del artista"
									/>
									<button
										type="button"
										onClick={() => removeArrayItem('artists', index)}
										className="p-2 text-red-500 hover:text-red-700 rounded-full"
									>
										<Trash2 size={20} />
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Contributors Section */}
					<div className="space-y-4">
						<div className="flex justify-between items-center">
							<h3 className="text-lg font-medium text-gray-900">
								Contribuidores
							</h3>
							<button
								type="button"
								onClick={() => addArrayItem('contributors')}
								className="p-2 text-brand-light hover:text-brand-dark rounded-full"
							>
								<Plus size={20} />
							</button>
						</div>
						<div className="space-y-4">
							{formData.contributors.map((contributor, index) => (
								<div
									key={index}
									className="grid grid-cols-4 gap-4 items-center"
								>
									<input
										type="number"
										value={contributor.id}
										onChange={e =>
											handleArrayChange(
												'contributors',
												index,
												'id',
												parseInt(e.target.value)
											)
										}
										className="border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
										placeholder="ID"
									/>
									<input
										type="number"
										value={contributor.contributor}
										onChange={e =>
											handleArrayChange(
												'contributors',
												index,
												'contributor',
												parseInt(e.target.value)
											)
										}
										className="border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
										placeholder="Contributor"
									/>
									<input
										type="number"
										value={contributor.role}
										onChange={e =>
											handleArrayChange(
												'contributors',
												index,
												'role',
												parseInt(e.target.value)
											)
										}
										className="border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
										placeholder="Role"
									/>
									<div className="flex items-center gap-2">
										<input
											type="number"
											value={contributor.order}
											onChange={e =>
												handleArrayChange(
													'contributors',
													index,
													'order',
													parseInt(e.target.value)
												)
											}
											className="border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
											placeholder="Order"
										/>
										<button
											type="button"
											onClick={() => removeArrayItem('contributors', index)}
											className="p-2 text-red-500 hover:text-red-700 rounded-full"
										>
											<Trash2 size={20} />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Publishers Section */}
					<div className="space-y-4">
						<div className="flex justify-between items-center">
							<h3 className="text-lg font-medium text-gray-900">Publishers</h3>
							<button
								type="button"
								onClick={() => addArrayItem('publishers')}
								className="p-2 text-brand-light hover:text-brand-dark rounded-full"
							>
								<Plus size={20} />
							</button>
						</div>
						<div className="space-y-4">
							{formData.publishers.map((publisher, index) => (
								<div key={index} className="flex items-center gap-4">
									<input
										type="text"
										value={publisher}
										onChange={e =>
											handleArrayChange('publishers', index, '', e.target.value)
										}
										className="flex-1 border-0 border-b border-gray-300 px-2 py-1 focus:border-b focus:border-brand-dark focus:outline-none focus:ring-0"
										placeholder="Publisher"
									/>
									<button
										type="button"
										onClick={() => removeArrayItem('publishers', index)}
										className="p-2 text-red-500 hover:text-red-700 rounded-full"
									>
										<Trash2 size={20} />
									</button>
								</div>
							))}
						</div>
					</div>

					<div className="flex justify-end space-x-3 mt-6">
						<button
							type="button"
							onClick={onClose}
							disabled={isLoading}
							className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
							<span className="group-hover:text-brand-dark">Cancelar</span>
						</button>
						<button
							type="submit"
							disabled={isLoading}
							className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<>
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
									<span>Guardando...</span>
								</>
							) : (
								<>
									<Save className="h-4 w-4 group-hover:text-brand-dark" />
									<span className="group-hover:text-brand-dark">
										Guardar cambios
									</span>
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default UpdateTrackModal;
