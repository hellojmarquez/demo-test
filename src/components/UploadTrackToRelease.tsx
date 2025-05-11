import React, { useState, useRef } from 'react';
import { X, Plus, ArrowBigUp, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UploadTrackToReleaseProps {
	isOpen: boolean;
	onClose: () => void;
	releaseId: string;
	onUploadComplete?: (
		uploadedTracks: { title: string; mixName: string; file: File }[]
	) => void;
	onUploadProgress?: (progress: {
		total: number;
		loaded: number;
		percentage: number;
	}) => void;
}

interface AssetRow {
	id: number;
	title: string;
	mixName: string;
	file: File | null;
}

const UploadTrackToRelease: React.FC<UploadTrackToReleaseProps> = ({
	isOpen,
	onClose,
	releaseId,
	onUploadComplete,
	onUploadProgress,
}) => {
	const router = useRouter();
	const [assets, setAssets] = useState<AssetRow[]>([]);
	const [error, setError] = useState('');
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

			// Crear FormData con todos los tracks
			const formData = new FormData();
			const trackPromises = validAssets.map(async (asset, index) => {
				// Crear el objeto de datos para el track
				const trackData = {
					order: index + 1,
					name: asset.title.trim(),
					mix_name: asset.mixName.trim() || '',
					language: 'AB',
					vocals: 'ZXX',
					artists: [
						{
							id: 22310,
							order: 2147483647,
							artist: 1541,
							kind: 'main',
							name: 'Jhon Doe',
						},
					],
					publishers: [
						{
							order: 3,
							publisher: 70,
							author: 'Juan Cisneros',
						},
					],
					contributors: [
						{
							id: 555,
							order: 3,
							contributor: 1046,
							role: 2,
							name: 'Jhon Doe',
						},
					],
					label_share: '',
					genre: { id: 3, name: 'Alternative' },
					subgenre: {
						id: 90,
						name: 'Alternative',
					},
					dolby_atmos_resource: '',
					copyright_holder: 'ISLA sOUNDS',
					copyright_holder_year: '2025',
					album_only: true,
					sample_start: '',
					explicit_content: true,
					ISRC: '',
					generate_isrc: true,
					DA_ISRC: '',
					track_lenght: '',
				};

				const trackFormData = new FormData();
				trackFormData.append('data', JSON.stringify(trackData));
				if (asset.file) {
					trackFormData.append('file', asset.file);
				}

				// Crear una promesa para manejar la respuesta
				return new Promise<{
					success: boolean;
					message?: string;
					data: { external_id: string; resource: string };
				}>((resolve, reject) => {
					const xhr = new XMLHttpRequest();

					xhr.upload.onprogress = event => {
						if (event.lengthComputable) {
							onUploadProgress?.({
								total: event.total,
								loaded: event.loaded,
								percentage: Math.round((event.loaded / event.total) * 100),
							});
						}
					};

					xhr.onload = () => {
						if (xhr.status >= 200 && xhr.status < 300) {
							try {
								const response = JSON.parse(xhr.responseText);
								resolve(response);
							} catch (e) {
								reject(
									new Error('Error al procesar la respuesta del servidor')
								);
							}
						} else {
							reject(new Error(xhr.responseText || 'Error en la petición'));
						}
					};

					xhr.onerror = () => {
						reject(new Error('Error de red'));
					};

					xhr.open('POST', `/api/admin/createSingle`);
					xhr.send(trackFormData);
				});
			});

			// Cerrar el modal inmediatamente
			onClose();

			// Esperar a que todos los tracks se creen
			const trackResponses = await Promise.all(trackPromises);

			// Verificar si hubo algún error
			const failedTracks = trackResponses.filter(response => !response.success);
			if (failedTracks.length > 0) {
				throw new Error('Error al crear algunos tracks');
			}

			// Obtener el release actual
			const releaseRes = await fetch(`/api/admin/getReleaseById/${releaseId}`);
			if (!releaseRes.ok) {
				throw new Error('Error al obtener el release actual');
			}
			const releaseData = await releaseRes.json();
			const currentRelease = releaseData.data;

			// Actualizar el release con todos los nuevos tracks
			const updateFormData = new FormData();
			updateFormData.append(
				'data',
				JSON.stringify({
					tracks: [
						...(currentRelease.tracks || []),
						...trackResponses.map(response => ({
							external_id: Number(response.data.external_id),
							resource: response.data.resource,
						})),
					],
				})
			);

			const updateReleaseRes = await fetch(
				`/api/admin/updateRelease/${releaseId}`,
				{
					method: 'PUT',
					body: updateFormData,
				}
			);

			if (!updateReleaseRes.ok) {
				throw new Error('Error al actualizar el release con los nuevos tracks');
			}

			// Notificar al componente padre sobre los tracks subidos
			onUploadComplete?.(
				validAssets.map(asset => ({
					title: asset.title.trim(),
					mixName: asset.mixName.trim(),
					file: asset.file!,
				}))
			);

			// Limpiar el formulario
			setAssets([]);
			setError('');

			// Forzar una actualización completa de los datos
			router.refresh();

			// Cerrar el modal después de un breve retraso para asegurar que los datos se actualicen
			setTimeout(() => {
				onClose();
			}, 500);
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
							disabled={isLoading}
							className="px-4 py-2 text-sm font-medium text-white bg-brand-light hover:bg-brand-dark rounded-md disabled:opacity-50"
						>
							{isLoading ? 'Subiendo...' : 'Crear Assets'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UploadTrackToRelease;
