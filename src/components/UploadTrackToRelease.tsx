import React, { useState, useRef } from 'react';
import { X, Plus, ArrowBigUp, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Track } from '@/types/track';

interface UploadTrackToReleaseProps {
	isOpen: boolean;
	releaseId: number;
	onClose: () => void;
	existingTracksCount: number;
	onTracksReady: (tracks: { file: File; data: any }[]) => void;
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
	existingTracksCount,
	onTracksReady,
}) => {
	console.log('releaseId!!!!!!!!!!!: ', releaseId);
	const router = useRouter();
	const [assets, setAssets] = useState<AssetRow[]>([]);
	const [error, setError] = useState('');
	const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

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
		setError('');

		// Validar que al menos un asset tenga título y archivo
		const validAssets = assets.filter(asset => asset.title && asset.file);

		if (validAssets.length === 0) {
			setError('Por favor agrega al menos un asset con título y archivo');
			return;
		}

		// Preparar los tracks para enviar al padre
		const tracksToUpload = validAssets.map((asset, index) => {
			const track = {
				order: existingTracksCount + index,
				name: asset.title,
				mix_name: asset.mixName,
				release: releaseId,
				language: 'ES',
				vocals: 'ZXX',
				artists: [
					{
						artist: 1541,
						kind: 'main',
						order: 5,
						name: 'Jhon Doe',
					},
				],
				publishers: [
					{
						order: 3,
						publisher: 194,
						name: 'ISLA SOUNDS',
						author: 'Juan Cisneros',
					},
				],
				contributors: [
					{
						order: 3,
						contributor: 1019,
						name: 'Jhon Doe',
						role: 2,
						role_name: 'Composer',
					},
				],
				label_share: '50',
				copyright_holder: 'ISLA SOUNDS',
				copyright_holder_year: '2025',
				generate_isrc: true,
				dolby_atmos_resource: '',
				DA_ISRC: '',
				genre: 3,
				genre_name: 'Alternative',
				subgenre: 90,
				subgenre_name: 'Alternative',
				album_only: false,
				explicit_content: false,
				track_lenght: '00:03:00',
				sample_start: '00:00:00',
				status: 'Borrador',
			};

			return {
				file: asset.file as File,
				data: track,
			};
		});
		console.log('tracksToUpload!!!!!!!!!!!: ', tracksToUpload);
		// Enviar los tracks al componente padre y cerrar el modal inmediatamente
		onTracksReady(tracksToUpload);
		onClose();

		// Limpiar el formulario
		setAssets([]);
		setError('');
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
												className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-light"
											>
												<ArrowBigUp className="w-6 h-6" />
												<p className="hover:underline">Añadir archivo</p>
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
