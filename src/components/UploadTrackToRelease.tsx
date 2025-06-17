'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Artist } from '@/types/release';
import { X, Plus, ArrowBigUp, Trash2, Import } from 'lucide-react';
import Select from 'react-select';

interface ReleaseTrack {
	_id: string; // MongoDB _id
	external_id?: string;
	order: number;
	name: string;
	artists: Artist[];
	ISRC: string;
	generate_isrc: boolean;
	DA_ISRC: string;
	genre: number;
	genre_name: string;
	subgenre: number;
	subgenre_name: string;
	mix_name: string;
	resource: string | File;
	dolby_atmos_resource: string;
	album_only: boolean;
	explicit_content: boolean;
	track_length: string;
}

interface Track {
	id: number;
	name: string;
}

interface UploadTrackToReleaseProps {
	isOpen: boolean;
	releaseId: number;
	onClose: () => void;
	existingTracksCount: number;
	onTracksReady: (tracks: { file: File | null; data: any }[]) => void;
}

interface AssetRow {
	id: number;
	title: string;
	mixName: string;
	file: File | null;
	isImported?: boolean;
	[key: string]: any; // Permite propiedades adicionales
}

const UploadTrackToRelease: React.FC<UploadTrackToReleaseProps> = ({
	isOpen,
	onClose,
	releaseId,
	existingTracksCount,
	onTracksReady,
}) => {
	const [assets, setAssets] = useState<AssetRow[]>([]);
	const [error, setError] = useState('');
	const [tracks, setTracks] = useState<ReleaseTrack[]>([]);
	const [selectedTrack, setSelectedTrack] = useState<ReleaseTrack | null>(null);
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

		// Validar que al menos un asset tenga título y archivo, o sea un track importado
		const validAssets = assets.filter(
			asset =>
				(asset.title && asset.file) || // assets normales con archivo
				(asset.title && asset.isImported) // tracks importados
		);

		if (validAssets.length === 0) {
			setError(
				'Por favor agrega al menos un asset con título y archivo o un track importado'
			);
			return;
		}

		// Preparar los tracks para enviar al padre
		const defaultArtists = [
			{
				artist: process.env.DEFAULT_ARTIST_ID,
				kind: process.env.DEFAULT_ARTIST_KIND,
				order: 0,
				name: process.env.DEFAULT_ARTIST_NAME,
			},
		];
		const defaultPublishers = [
			{
				order: 0,
				publisher: process.env.DEFAULT_PUBLISHER_ID,
				name: process.env.DEFAULT_PUBLISHER_NAME,
				author: process.env.DEFAULT_PUBLISHER_AUTHOR,
			},
		];
		const defaultContributors = [
			{
				order: 0,
				contributor: process.env.DEFAULT_CONTRIBUTOR_ID,
				name: process.env.DEFAULT_CONTRIBUTOR_NAME,
				role: process.env.DEFAULT_CONTRIBUTOR_ROLE,
				role_name: process.env.DEFAULT_CONTRIBUTOR_ROLE_NAME,
			},
		];
		const tracksToUpload = validAssets.map((asset, index) => {
			const track = {
				...asset,

				order: existingTracksCount + index,
				name: asset.title,
				mix_name: asset.isImported ? asset?.mix_name : '',
				release: releaseId,
				resource: asset.isImported ? asset?.resource : null,
				language: asset.isImported ? asset?.language : 'ES',
				vocals: asset.isImported ? asset.vocals : 'ZXX',
				artists: asset.isImported ? asset?.artists : defaultArtists,
				publishers: asset.isImported ? asset?.publishers : defaultPublishers,
				contributors: asset.isImported
					? asset?.contributors
					: defaultContributors,
				label_share: asset.isImported ? asset?.label_share : '50',
				copyright_holder: asset.isImported
					? asset?.copyright_holder
					: 'ISLA SOUNDS',
				copyright_holder_year: asset.isImported
					? asset?.copyright_holder_year
					: '2025',
				generate_isrc: asset.isImported ? asset?.generate_isrc : true,
				dolby_atmos_resource: asset.isImported
					? asset?.dolby_atmos_resource
					: '',
				DA_ISRC: asset.isImported ? asset?.DA_ISRC : '',
				genre: asset.isImported ? asset?.genre : 3,
				genre_name: asset.isImported ? asset?.genre_name : 'Alternative',
				subgenre: asset.isImported ? asset?.subgenre : 90,
				subgenre_name: asset.isImported ? asset?.subgenre_name : 'Alternative',
				album_only: asset.isImported ? asset?.album_only : false,
				explicit_content: asset.isImported ? asset?.explicit_content : false,
				track_length: asset.isImported ? asset?.track_length : '00:03:00',
				sample_start: asset.isImported ? asset?.sample_start : '00:00:00',
				status: asset.isImported ? asset?.status : 'Borrador',
			};

			return {
				file: asset.isImported ? null : (asset.file as File),
				data: track,
			};
		});

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

	const handleImportTrack = () => {
		if (!selectedTrack) {
			setError('Por favor selecciona un track para importar');
			return;
		}

		// Crear un nuevo asset con toda la información del track seleccionado
		const { order, name, mix_name, _id, ...trackData } = selectedTrack;
		const newAsset: AssetRow = {
			id: Date.now(), // id local para el asset
			title: name,
			mixName: mix_name,
			file: null,
			isImported: true,
			_id: _id, // guardar el _id de MongoDB
			// Copiar todas las propiedades del track seleccionado excepto order, name, mix_name y _id
			...trackData,
		};

		setAssets(prev => [...prev, newAsset]);
		setSelectedTrack(null);
		setError('');
	};

	if (!isOpen) return null;
	useEffect(() => {
		const tracksRequest = async () => {
			const tracks = await fetch(`/api/admin/getAllTracks?all=true`);

			const res = await tracks.json();
			console.log('res tracks', res.data.tracks);
			setTracks(res.data.tracks);
		};
		tracksRequest();
	}, []);
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

				<div className="mb-4 flex justify-end items-center gap-2">
					<button
						type="button"
						className="p-2 text-brand-light hover:text-brand-dark transition-colors"
						title="Importar track seleccionado"
						onClick={handleImportTrack}
					>
						<Import className="w-5 h-5" />
					</button>
					<Select
						options={tracks.map(track => ({
							value: track.external_id,
							label: track.name,
						}))}
						value={
							selectedTrack
								? {
										value: selectedTrack.external_id,
										label: selectedTrack.name,
								  }
								: null
						}
						onChange={option => {
							if (option) {
								const track = tracks.find(t => t.external_id === option.value);
								if (track) {
									setSelectedTrack(track);
								}
							} else {
								setSelectedTrack(null);
							}
						}}
						placeholder="Seleccionar track existente..."
						className="react-select-container max-w-72"
						classNamePrefix="react-select"
						styles={{
							control: provided => ({
								...provided,
								minHeight: '36px',
								'@media (max-width: 768px)': {
									minHeight: '42px',
								},
							}),
							placeholder: provided => ({
								...provided,
								fontSize: '0.875rem', // 14px
								color: '#6B7280', // text-gray-500
							}),
							container: provided => ({
								...provided,
								width: '100%',
							}),
							menu: provided => ({
								...provided,
								width: '100%',
								zIndex: 9999,
							}),
							valueContainer: provided => ({
								...provided,
								padding: '0 8px',
								'@media (max-width: 768px)': {
									padding: '0 12px',
								},
							}),
							input: provided => ({
								...provided,
								margin: '0',
								padding: '0',
							}),
							indicatorsContainer: provided => ({
								...provided,
								padding: '0 8px',
								'@media (max-width: 768px)': {
									padding: '0 12px',
								},
							}),
							option: (provided, state) => ({
								...provided,
								padding: '6px 12px',
								'@media (max-width: 768px)': {
									padding: '8px 12px',
								},
								backgroundColor: state.isSelected
									? '#4B5563'
									: state.isFocused
									? '#F3F4F6'
									: 'white',
								color: state.isSelected ? 'black' : '#1F2937',
								'&:hover': {
									backgroundColor: state.isSelected ? '#4B5563' : '#F3F4F6',
								},
							}),
						}}
					/>
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
										{!asset.isImported && (
											<input
												type="file"
												ref={(el: HTMLInputElement | null) => {
													if (el) fileInputRefs.current[asset.id] = el;
												}}
												accept=".wav"
												onChange={e => handleFileChange(asset.id, e)}
												className="hidden"
											/>
										)}
										{!asset.isImported && !asset.file ? (
											<button
												type="button"
												onClick={() => handleFileButtonClick(asset.id)}
												className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-light"
											>
												<ArrowBigUp className="w-6 h-6" />
												<p className="hover:underline">Añadir archivo</p>
											</button>
										) : !asset.isImported && asset.file ? (
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
										) : (
											<span className="text-sm text-gray-500">
												Track importado
											</span>
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
