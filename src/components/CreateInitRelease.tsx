'use client';

import { useState } from 'react';
import { Upload, X, XCircle, Save } from 'lucide-react';
import VinylLoader from './VinylLoader';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface CreateInitReleaseProps {
	onCancel: () => void;
	onSubmit: (data: { title: string; image: File | null }) => void;
}

export default function CreateInitRelease({
	onCancel,
	onSubmit,
}: CreateInitReleaseProps) {
	const [title, setTitle] = useState('');
	const [image, setImage] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<{
		total: number;
		loaded: number;
		percentage: number;
		totalChunks: number;
		filesCompleted: number;
	} | null>(null);
	const router = useRouter();

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		setError(null);

		if (file) {
			// Validar tipo de archivo
			if (file.type !== 'image/jpeg') {
				setError('Solo se permiten archivos JPG');
				return;
			}

			// Validar tamaño (4MB = 4 * 1024 * 1024 bytes)
			if (file.size > 4 * 1024 * 1024) {
				setError('El archivo no debe superar los 4MB');
				return;
			}

			setImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};
	const createChunks = (file: File, chunkSize: number = 250 * 1024) => {
		const chunks = [];
		const totalChunks = Math.ceil(file.size / chunkSize);

		for (let i = 0; i < totalChunks; i++) {
			const start = i * chunkSize;
			const end = Math.min(start + chunkSize, file.size);
			chunks.push({
				chunk: file.slice(start, end),
				index: i,
				total: totalChunks,
			});
		}

		return chunks;
	};

	// Función para subir un chunk
	const uploadChunk = async (
		chunk: Blob,
		chunkIndex: number,
		totalChunks: number,
		trackData: any,
		fileName: string
	) => {
		const formData = new FormData();
		formData.append('chunk', chunk);
		formData.append('chunkIndex', chunkIndex.toString());
		formData.append('totalChunks', totalChunks.toString());

		formData.append('data', JSON.stringify(trackData));
		formData.append('fileName', fileName);

		const response = await fetch('/api/admin/createRelease', {
			method: 'POST',
			body: formData,
		});
		if (response.ok) {
			setUploadProgress(prev => {
				if (!prev) return prev;
				const newLoaded = prev.loaded + 1;
				return {
					...prev,
					loaded: newLoaded,
					percentage: Math.floor((newLoaded / prev.totalChunks) * 100),
				};
			});
		}

		return response.json();
	};

	// Función para subir archivo completo por chunks
	const uploadFileByChunks = async (
		file: File,
		trackData: any,
		fileName: string
	) => {
		const chunks = createChunks(file);
		let lastResponse = null;

		for (let i = 0; i < chunks.length; i++) {
			const { chunk, index, total } = chunks[i];
			lastResponse = await uploadChunk(
				chunk,
				index,
				total,
				trackData,
				fileName
			);
		}

		return lastResponse;
	};
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);
		setUploadProgress(null);
		if (!image) {
			setError('Debes seleccionar una imagen');
			setIsLoading(false);
			return;
		}
		const totalChunks = image ? Math.ceil(image.size / (250 * 1024)) : 0;

		setUploadProgress({
			total: image ? 1 : 0, // 1 archivo
			loaded: 0,
			percentage: 0,
			totalChunks: totalChunks,
			filesCompleted: 0, // Empezar en 0, no en 1
		});
		try {
			const defaultLabelId = process.env.NEXT_PUBLIC_DEFAULT_LABEL_ID;
			const defaultLabelName = process.env.NEXT_PUBLIC_DEFAULT_LABEL_NAME;

			const defaultPublisherId = process.env.NEXT_PUBLIC_DEFAULT_PUBLISHER_ID;
			const defaultPublisherName =
				process.env.NEXT_PUBLIC_DEFAULT_PUBLISHER_NAME;

			const defaultGenreId = process.env.NEXT_PUBLIC_DEFAULT_GENRE_ID;
			const defaultGenreName = process.env.NEXT_PUBLIC_DEFAULT_GENRE_NAME;
			const defaultSubgenreId = process.env.NEXT_PUBLIC_DEFAULT_SUBGENRE_ID;
			const defaultSubgenreName = process.env.NEXT_PUBLIC_DEFAULT_SUBGENRE_NAME;
			const data = {
				name: title,
				picture: 'image',
				label: defaultLabelId || 0,
				label_name: defaultLabelName || '',
				publisher: defaultPublisherId || 0,
				publisher_name: defaultPublisherName || '',
				genre: defaultGenreId || 0,
				genre_name: defaultGenreName || '',
				subgenre: defaultSubgenreId || 0,
				subgenre_name: defaultSubgenreName || '',
				artists: [],
				publisher_year: '2025',
				copyright_holder: 'Sample value',
				copyright_holder_year: '2025',
				generate_ean: true,
				kind: 'single',
				catalogue_number: 'islasounds',
				is_new_release: 1,
				official_date: '2025-10-10',
				original_date: '2025-10-10',
				release_version: '',
				territory: 'worldwide',
				available: true,
				backcatalog: false,
				youtube_declaration: true,
			};
			const timestamp = Date.now();
			const fileExtension = image.name.split('.').pop(); // Obtiene la extensión
			const imageName =
				'cover_' + title + '_' + timestamp + '.' + fileExtension;
			const createResponse = await uploadFileByChunks(image, data, imageName);

			if (!createResponse.success) {
				const errorMessage =
					typeof createResponse.error === 'object'
						? Object.entries(createResponse.error)
								.map(([key, value]) => {
									if (Array.isArray(value)) {
										// Manejar arrays de objetos como artists: [{ artist: ['error'] }]
										const arrayErrors = value
											.map((item, index) => {
												if (typeof item === 'object' && item !== null) {
													return Object.entries(item)
														.map(([nestedKey, nestedValue]) => {
															if (Array.isArray(nestedValue)) {
																return `${nestedKey}: ${nestedValue.join(
																	', '
																)}`;
															}
															return `${nestedKey}: ${nestedValue}`;
														})
														.join(', ');
												}
												return String(item);
											})
											.join(', ');
										return `${key}: ${arrayErrors}`;
									}
									if (typeof value === 'object' && value !== null) {
										// Manejar estructuras anidadas como { artists: [{ artist: ['error'] }] }
										const nestedErrors = Object.entries(value)
											.map(([nestedKey, nestedValue]) => {
												if (Array.isArray(nestedValue)) {
													return `${nestedKey}: ${nestedValue.join(', ')}`;
												}
												if (
													typeof nestedValue === 'object' &&
													nestedValue !== null
												) {
													return `${nestedKey}: ${Object.values(nestedValue)
														.flat()
														.join(', ')}`;
												}
												return `${nestedKey}: ${nestedValue}`;
											})
											.join(', ');
										return `${key}: ${nestedErrors}`;
									}
									return `${key}: ${value}`;
								})
								.filter(Boolean)
								.join('\n')
						: createResponse.error;
				setError(errorMessage);
				throw new Error(errorMessage || 'Error al crear el lanzamiento');
			}

			toast.success('¡Producto creado exitosamente!');
			router.refresh();
			onSubmit({ title, image });
		} catch (err: any) {
			toast.error(
				err instanceof Error ? err.message : 'Error al crear el lanzamiento'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const removeImage = () => {
		setImage(null);
		setPreview(null);
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto relative">
			{isLoading && (
				<div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
					<div className="flex flex-col items-center gap-4">
						<VinylLoader size={80} />
					</div>
				</div>
			)}
			<form className="space-y-6">
				<div>
					<h1 className="block text-lg font-medium text-gray-500 mb-1">
						Crear lanzamiento
					</h1>
				</div>
				<div className="flex justify-center items-start gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-400 mb-1">
							Portada
						</label>
						<div className="mt-1 flex justify-center">
							<div className="relative group">
								{preview ? (
									<div className="relative">
										<img
											src={preview}
											alt="Preview"
											className="mx-auto h-32 w-32 object-cover rounded-md"
										/>
										<button
											type="button"
											onClick={removeImage}
											className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
										>
											<X size={16} />
										</button>
									</div>
								) : (
									<>
										<label
											htmlFor="file-upload"
											className="relative cursor-pointer block h-32 w-32 mx-auto"
										>
											<img
												src="/images/cd_box.png"
												alt="CD Box"
												className="h-32 w-32 object-contain"
											/>
											<div className="absolute top-[19px] left-0 right-0 bottom-4 flex flex-col items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 h-[90px] w-32">
												<Upload className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-2" />
												<span className="text-white text-[10px] opacity-0 text-center group-hover:opacity-100 transition-opacity duration-200">
													Haz click para subir tu imagen
												</span>
											</div>
											<input
												id="file-upload"
												name="file-upload"
												type="file"
												className="sr-only"
												accept=".jpg,.jpeg"
												onChange={handleImageChange}
											/>
										</label>
									</>
								)}
							</div>
						</div>
						<p className="text-[10px] italic text-gray-400 mt-2">
							Tamaño maximo 4MB
						</p>
						{error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
					</div>
					<div>
						<label
							htmlFor="title"
							className="block text-sm font-medium text-gray-400 mb-1"
						>
							Título
						</label>
						<input
							type="text"
							id="title"
							value={title}
							onChange={e => setTitle(e.target.value)}
							className="w-full px-3 py-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
							placeholder="Ingresa el título"
							required
						/>
					</div>
				</div>

				<div className="flex justify-end space-x-3">
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
						<span className="group-hover:text-brand-dark">Cancelar</span>
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Save className="h-4 w-4 group-hover:text-brand-dark" />
						<span className="group-hover:text-brand-dark">Crear</span>
					</button>
				</div>
			</form>
		</div>
	);
}
