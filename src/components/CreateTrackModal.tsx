import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, XCircle, Plus, Trash2, Upload } from 'lucide-react';

interface Artist {
	_id: string;
	external_id: string;
	name: string;
	role: string;
}

interface Contributor {
	external_id: number;
	name: string;
	role: number;
	order: number;
}

interface Publisher {
	id: number;
	name: string;
	publisher: number;
	author: string;
	order: number;
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

interface Track {
	_id: string;
	name: string;
	mix_name: string;
	DA_ISRC: string;
	ISRC: string;
	__v: number;
	album_only: boolean;
	artists: { artist: number; kind: string; order: number; name: string }[];
	contributors: TrackContributor[];
	copyright_holder: string;
	copyright_holder_year: string;
	createdAt: string;
	dolby_atmos_resource: string;
	explicit_content: boolean;
	generate_isrc: boolean;
	genre: {
		id: number;
		name: string;
	};
	subgenre: {
		id: number;
		name: string;
	};
	label_share: string;
	language: string;
	order: number | null;
	publishers: { publisher: number; author: string; order: number }[];
	release: string;
	resource: string | File | null;
	sample_start: string;
	track_lenght: string;
	updatedAt: string;
	vocals: string;
}

interface CreateTrackModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (newTrack: Track) => void;
}

const CreateTrackModal: React.FC<CreateTrackModalProps> = ({
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState<Partial<Track>>({
		name: '',
		mix_name: '',
		DA_ISRC: '',
		ISRC: '',
		album_only: false,
		artists: [],
		contributors: [],
		copyright_holder: '',
		copyright_holder_year: '',
		dolby_atmos_resource: '',
		explicit_content: false,
		generate_isrc: false,
		genre: { id: 0, name: '' },
		subgenre: { id: 0, name: '' },
		label_share: '',
		language: '',
		order: null,
		publishers: [],
		release: '',
		resource: null,
		sample_start: '',
		track_lenght: '',
		vocals: '',
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			await onSave(formData as Track);
			onClose();
		} catch (err: any) {
			setError(err.message || 'Error al crear el track');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
						onClick={e => e.stopPropagation()}
					>
						<div className="p-6 border-b border-gray-200 flex justify-between items-center">
							<h2 className="text-xl font-semibold text-gray-800">
								Crear Track
							</h2>
							<button
								onClick={onClose}
								className="p-1 rounded-full hover:bg-gray-100 transition-colors"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6 space-y-6">
							{error && (
								<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
									{error}
								</div>
							)}

							<div className="grid grid-cols-2 gap-6">
								{/* Información Básica */}
								<div className="space-y-4">
									<h3 className="text-lg font-medium text-gray-700">
										Información Básica
									</h3>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Nombre del Track
										</label>
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Nombre del Mix
										</label>
										<input
											type="text"
											name="mix_name"
											value={formData.mix_name}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											ISRC
										</label>
										<input
											type="text"
											name="ISRC"
											value={formData.ISRC}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											DA ISRC
										</label>
										<input
											type="text"
											name="DA_ISRC"
											value={formData.DA_ISRC}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>

								{/* Detalles del Track */}
								<div className="space-y-4">
									<h3 className="text-lg font-medium text-gray-700">
										Detalles del Track
									</h3>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Duración
										</label>
										<input
											type="text"
											name="track_lenght"
											value={formData.track_lenght}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="00:00:00"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Inicio de la Muestra
										</label>
										<input
											type="text"
											name="sample_start"
											value={formData.sample_start}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="00:00:00"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Vocalista
										</label>
										<input
											type="text"
											name="vocals"
											value={formData.vocals}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Idioma
										</label>
										<input
											type="text"
											name="language"
											value={formData.language}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-6">
								{/* Copyright */}
								<div className="space-y-4">
									<h3 className="text-lg font-medium text-gray-700">
										Copyright
									</h3>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Titular del Copyright
										</label>
										<input
											type="text"
											name="copyright_holder"
											value={formData.copyright_holder}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Año del Copyright
										</label>
										<input
											type="text"
											name="copyright_holder_year"
											value={formData.copyright_holder_year}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>

								{/* Label Share */}
								<div className="space-y-4">
									<h3 className="text-lg font-medium text-gray-700">
										Label Share
									</h3>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Porcentaje de Share
										</label>
										<input
											type="text"
											name="label_share"
											value={formData.label_share}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="Ej: 50%"
										/>
									</div>
								</div>
							</div>

							{/* Opciones */}
							<div className="space-y-4">
								<h3 className="text-lg font-medium text-gray-700">Opciones</h3>
								<div className="flex items-center space-x-4">
									<label className="flex items-center space-x-2">
										<input
											type="checkbox"
											name="album_only"
											checked={formData.album_only}
											onChange={handleChange}
											className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
										/>
										<span className="text-sm text-gray-700">Solo Álbum</span>
									</label>
									<label className="flex items-center space-x-2">
										<input
											type="checkbox"
											name="explicit_content"
											checked={formData.explicit_content}
											onChange={handleChange}
											className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
										/>
										<span className="text-sm text-gray-700">
											Contenido Explícito
										</span>
									</label>
									<label className="flex items-center space-x-2">
										<input
											type="checkbox"
											name="generate_isrc"
											checked={formData.generate_isrc}
											onChange={handleChange}
											className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
										/>
										<span className="text-sm text-gray-700">Generar ISRC</span>
									</label>
								</div>
							</div>

							{/* Archivo */}
							<div className="space-y-4">
								<h3 className="text-lg font-medium text-gray-700">Archivo</h3>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Recurso Dolby Atmos
									</label>
									<input
										type="text"
										name="dolby_atmos_resource"
										value={formData.dolby_atmos_resource}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Archivo del Track
									</label>
									<input
										type="file"
										onChange={e => {
											if (e.target.files && e.target.files[0]) {
												setFormData(prev => ({
													...prev,
													resource: e.target.files![0],
												}));
											}
										}}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div className="flex justify-end space-x-4 pt-6">
								<button
									type="button"
									onClick={onClose}
									className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSubmitting ? 'Guardando...' : 'Guardar'}
								</button>
							</div>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default CreateTrackModal;
