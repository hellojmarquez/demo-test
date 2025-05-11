import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, ArrowBigUp, Trash2 } from 'lucide-react';

interface UploadTrackToReleaseProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: { title: string; mixName: string; file: File }) => void;
	releaseId: string;
}

interface AssetRow {
	id: number;
	title: string;
	mixName: string;
	file: File | null;
}

interface Track {
	_id: string;
	name: string;
	mix_name: string;
	resource: string;
	order: number;
}

const UploadTrackToRelease: React.FC<UploadTrackToReleaseProps> = ({
	isOpen,
	onClose,
	onSubmit,
	releaseId,
}) => {
	const [assets, setAssets] = useState<AssetRow[]>([]);
	const [error, setError] = useState('');
	const [tracks, setTracks] = useState<Track[]>([]);
	const [isLoadingTracks, setIsLoadingTracks] = useState(false);
	const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
	const [isLoading, setIsLoading] = useState(false);

	const inputStyles =
		'w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent';

	const handleAddAsset = () => {
		setAssets([
			...assets,
			{
				id: Date.now(),
				title: '',
				mixName: '',
				file: null,
			},
		]);
	};

	const handleAssetChange = (
		id: number,
		field: keyof AssetRow,
		value: string | File | null
	) => {
		setAssets(
			assets.map(asset =>
				asset.id === id ? { ...asset, [field]: value } : asset
			)
		);
	};

	const handleFileChange = (
		id: number,
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			// Normalizar el archivo
			const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'wav';
			const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
			const normalizedName = `${baseName}.${ext}`;
			const correctedFile = new File([selectedFile], normalizedName, {
				type: 'audio/wav',
			});

			// Validar que sea un archivo WAV
			if (ext !== 'wav') {
				setError('Solo se permiten archivos WAV');
				return;
			}

			handleAssetChange(id, 'file', correctedFile);
			setError('');
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			// Validar que al menos un asset tenga título y archivo
			const validAssets = assets.filter(asset => asset.title && asset.file);
			if (validAssets.length === 0) {
				setError('Por favor agrega al menos un asset con título y archivo');
				return;
			}

			console.log('Assets válidos antes de enviar:', validAssets);

			// Crear FormData con todos los tracks
			const formData = new FormData();
			validAssets.forEach((asset, index) => {
				console.log('Procesando asset para enviar:', {
					index,
					title: asset.title,
					titleLength: asset.title.length,
					mixName: asset.mixName,
					file: asset.file?.name,
				});

				formData.append('tracks[]', index.toString());
				formData.append('titles[]', asset.title.trim());
				formData.append('mixNames[]', asset.mixName.trim() || '');
				if (asset.file) {
					formData.append('files[]', asset.file);
				}
			});

			// Verificar los datos antes de enviar
			console.log('Datos a enviar:', {
				tracks: formData.getAll('tracks[]'),
				titles: formData.getAll('titles[]'),
				mixNames: formData.getAll('mixNames[]'),
				files: formData.getAll('files[]').map((f: any) => f.name),
			});

			// Enviar los datos al endpoint de actualizar release
			const response = await fetch(`/api/admin/updateRelease/${releaseId}`, {
				method: 'PUT',
				body: formData,
				credentials: 'include',
			});

			const result = await response.json();
			console.log('Respuesta del servidor:', result);

			if (!result.success) {
				throw new Error(result.message || 'Error al crear los tracks');
			}

			// Limpiar el formulario y cerrar el modal
			setAssets([]);
			setError('');

			// Recargar los tracks después de crear nuevos
			await fetchTracks();

			onClose();
		} catch (err: any) {
			console.error('Error al crear tracks:', err);
			setError(err.message || 'Error al crear los tracks');
		} finally {
			setIsLoading(false);
		}
	};

	const handleFileButtonClick = (id: number) => {
		fileInputRefs.current[id]?.click();
	};

	const handleDeleteAsset = (id: number) => {
		setAssets(assets.filter(asset => asset.id !== id));
	};

	// Función para obtener los tracks
	const fetchTracks = async () => {
		try {
			setIsLoadingTracks(true);
			console.log('Iniciando fetchTracks para releaseId:', releaseId);

			const response = await fetch(
				`/api/admin/getTracksByRelease/${releaseId}`
			);
			const data = await response.json();
			console.log('Datos recibidos de getTracksByRelease:', data);

			if (data.success) {
				// Limpiar los tracks actuales antes de establecer los nuevos
				setTracks([]);
				console.log('Tracks a establecer:', data.data);
				setTracks(data.data);
			} else {
				console.error('Error en la respuesta:', data);
				setError('Error al cargar los tracks');
			}
		} catch (err) {
			console.error('Error al cargar tracks:', err);
			setError('Error al cargar los tracks');
		} finally {
			setIsLoadingTracks(false);
		}
	};

	// Cargar tracks cuando se abre el modal
	useEffect(() => {
		if (isOpen) {
			console.log('Modal abierto, cargando tracks...');
			fetchTracks();
		} else {
			// Limpiar los tracks cuando se cierra el modal
			console.log('Modal cerrado, limpiando tracks...');
			setTracks([]);
		}
	}, [isOpen, releaseId]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-4xl">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-900">Crear Asset</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				{/* Sección de tracks existentes */}
				<div className="mb-6">
					<h3 className="text-lg font-medium text-gray-900 mb-3">
						Tracks Existentes
					</h3>
					{isLoadingTracks ? (
						<div className="flex justify-center">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-light"></div>
						</div>
					) : tracks.length > 0 ? (
						<div className="space-y-2">
							{Array.from(
								new Map(tracks.map(track => [track._id, track])).values()
							).map(track => {
								console.log('Renderizando track único:', track);
								return (
									<div
										key={track._id}
										className="flex items-center justify-between p-3 bg-gray-50 rounded"
									>
										<div className="flex items-center space-x-3">
											<span className="text-sm font-medium">
												{track.name || 'Track sin nombre'}
											</span>
											{track.mix_name && (
												<span className="text-sm text-gray-500">
													({track.mix_name})
												</span>
											)}
										</div>
										<div className="text-sm text-gray-500">
											Orden: {track.order}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<p className="text-sm text-gray-500">
							No hay tracks en este release
						</p>
					)}
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Título
								</th>
								<th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Nombre del Mix
								</th>
								<th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Archivo
								</th>
								<th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Acciones
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{assets.map(asset => (
								<tr key={asset.id}>
									<td className="px-6 py-2 whitespace-nowrap">
										<input
											type="text"
											value={asset.title}
											onChange={e =>
												handleAssetChange(asset.id, 'title', e.target.value)
											}
											className={inputStyles}
											placeholder="Ingresa el título"
										/>
									</td>
									<td className="px-6 py-2 whitespace-nowrap">
										<input
											type="text"
											value={asset.mixName}
											onChange={e =>
												handleAssetChange(asset.id, 'mixName', e.target.value)
											}
											className={inputStyles}
											placeholder="Ingresa el nombre del mix"
										/>
									</td>
									<td className="px-6 py-2 whitespace-nowrap">
										<input
											type="file"
											ref={(el: HTMLInputElement | null) => {
												if (el) fileInputRefs.current[asset.id] = el;
											}}
											accept=".wav"
											onChange={e => handleFileChange(asset.id, e)}
											className="hidden"
										/>
										{!asset.file ? (
											<button
												type="button"
												onClick={() => handleFileButtonClick(asset.id)}
												className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1DB954] rounded-md hover:bg-[#1ed760] transition-colors"
											>
												<ArrowBigUp className="w-4 h-4" />
												Añadir archivo
											</button>
										) : (
											<div className="flex items-center">
												<span className="text-sm text-gray-700">
													{asset.file.name}
												</span>
												<button
													type="button"
													onClick={() =>
														handleAssetChange(asset.id, 'file', null)
													}
													className="ml-2 text-red-600 hover:text-red-800"
												>
													<X size={16} />
												</button>
											</div>
										)}
									</td>
									<td className="px-6 py-2 whitespace-nowrap">
										<button
											type="button"
											onClick={() => handleDeleteAsset(asset.id)}
											className="p-2 text-red-600 hover:text-red-800"
										>
											<Trash2 size={20} />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{error && <div className="text-red-600 text-sm mt-2">{error}</div>}

				<div className="flex justify-between items-center mt-6">
					<button
						type="button"
						onClick={handleAddAsset}
						className="inline-flex items-center px-4 py-2 text-sm font-medium text-brand-light hover:text-brand-dark"
					>
						<Plus className="h-5 w-5 mr-2" />
						Nuevo Asset
					</button>

					<div className="flex space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							className="px-4 py-2 text-sm font-medium text-white bg-brand-light hover:bg-brand-dark rounded-md"
						>
							Crear Assets
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UploadTrackToRelease;
