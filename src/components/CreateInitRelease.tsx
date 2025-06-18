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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		if (!image) {
			setError('Debes seleccionar una imagen');
			setIsLoading(false);
			return;
		}

		try {
			const formData = new FormData();
			const defaultLabelId = process.env.NEXT_PUBLIC_DEFAULT_LABEL_ID;
			const defaultLabelName = process.env.NEXT_PUBLIC_DEFAULT_LABEL_NAME;

			const defaultPublisherId = process.env.NEXT_PUBLIC_DEFAULT_PUBLISHER_ID;
			const defaultPublisherName =
				process.env.NEXT_PUBLIC_DEFAULT_PUBLISHER_NAME;

			const defaultGenreId = process.env.NEXT_PUBLIC_DEFAULT_GENRE_ID;
			const defaultGenreName = process.env.NEXT_PUBLIC_DEFAULT_GENRE_NAME;
			const defaultSubgenreId = process.env.NEXT_PUBLIC_DEFAULT_SUBGENRE_ID;
			const defaultSubgenreName = process.env.NEXT_PUBLIC_DEFAULT_SUBGENRE_NAME;
			formData.append('name', title);
			formData.append('picture', image);
			formData.append('label', defaultLabelId?.toString() || '');
			formData.append('label_name', defaultLabelName?.toString() || '');
			formData.append('publisher', defaultPublisherId?.toString() || '');
			formData.append('publisher_name', defaultPublisherName?.toString() || '');
			formData.append('genre', defaultGenreId?.toString() || '');
			formData.append('genre_name', defaultGenreName || '');
			formData.append('subgenre', defaultSubgenreId?.toString() || '');
			formData.append('subgenre_name', defaultSubgenreName?.toString() || '');
			formData.append('artists', JSON.stringify([]));
			formData.append('publisher_year', '2025');
			formData.append('copyright_holder', 'Sample value');
			formData.append('copyright_holder_year', '2025');
			formData.append('generate_ean', 'true');
			formData.append('kind', 'single');
			formData.append('catalogue_number', 'islasounds');
			formData.append('is_new_release', '1');
			formData.append('official_date', '2025-10-10');
			formData.append('original_date', '2025-10-10');
			formData.append('release_version', '');
			formData.append('territory', 'worldwide');
			formData.append('available', 'true');
			formData.append('youtube_declaration', 'true');
			const response = await fetch('/api/admin/createRelease', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Error al crear el lanzamiento');
			}

			toast.success('¡Producto creado exitosamente!');
			router.refresh();
			onSubmit({ title, image });
		} catch (err: any) {
			setError(err.message || 'Error al crear el lanzamiento');
			toast.error(err.message || 'Error al crear el producto');
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
			<form onSubmit={handleSubmit} className="space-y-6">
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
						type="submit"
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
