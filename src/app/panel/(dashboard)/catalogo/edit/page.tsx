'use client';

import { useState, useEffect } from 'react';
import UpdateReleasePage from '@/components/UpdateReleaseModal';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Release, ReleaseResponse } from '@/types/release';
import { Track, TrackResponse } from '@/types/track';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import TrackForm, { GenreData } from '@/components/CreateTrackModal';
import { Save } from 'lucide-react';
import Spinner from '@/components/Spinner';

interface ApiError extends Error {
	info?: any;
	status?: number;
}
interface AsignedArtist {
	artista_id: {
		external_id: number;
		name: string;
	};
	created_at: string;
	estado: string;
	fecha_fin: string;
	fecha_inicio: string;
	porcentaje_distribucion: number;
	sello_id: string;
	tipo_contrato: string;
	updated_at: string;
	_id: string;
}
const fetcher = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		const error = new Error('Error en la petición') as ApiError;
		error.info = await response.json();
		error.status = response.status;
		throw error;
	}
	return response.json();
};

export default function EditPage() {
	const searchParams = useSearchParams();
	const { user } = useAuth();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState('details');
	const releaseId = searchParams?.get('releaseId') || null;
	const [asignedArtists, setAsignedArtists] = useState([]);
	const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
	const [editedTrackData, setEditedTrackData] = useState<Partial<Track> | null>(
		null
	);
	const [isProcessing, setIsProcessing] = useState(false);
	const [artistsErrors, setArtistsErrors] = useState<string[]>([]);
	const [genres, setGenres] = useState<GenreData[]>([]);
	const [formData, setFormData] = useState<Release>({
		name: '',
		picture: null,
		external_id: 0,
		auto_detect_language: false,
		generate_ean: false,
		backcatalog: false,
		youtube_declaration: false,
		dolby_atmos: false,
		artists: [],
		has_acr_alert: false,
		acr_alert: {},
		release_user_declaration: null,
		tracks: [],
		countries: [],
		catalogue_number: '',
		kind: '',
		label: 0,
		label_name: '',
		language: '',
		release_version: '',
		publisher: 0,
		publisher_name: '',
		publisher_year: '',
		copyright_holder: '',
		copyright_holder_year: '',
		genre: 0,
		genre_name: '',
		subgenre: 0,
		subgenre_name: '',
		artwork: '',
		is_new_release: 0,
		official_date: '',
		original_date: '',
		exclusive_shop: 0,
		territory: '',
		ean: '',
		newArtists: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});
	const [error, setError] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState<{
		total: number;
		loaded: number;
		percentage: number;
		totalChunks: number;
		filesCompleted: number;
	} | null>(null);

	const {
		data: releaseData,
		error: releaseError,
		mutate: mutateRelease,
	} = useSWR<ReleaseResponse>(
		releaseId ? `/api/admin/getReleaseById/${releaseId}` : null,
		fetcher,
		{
			revalidateOnFocus: false, // Deshabilitar revalidación automática
		}
	);

	const {
		data: tracksData,
		error: tracksError,
		mutate: mutateTracks,
	} = useSWR<TrackResponse>(
		releaseId ? `/api/admin/getTracksByRelease/${releaseId}` : null,
		fetcher,
		{
			revalidateOnFocus: false, // Deshabilitar revalidación automática
		}
	);

	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (releaseData?.data) {
			setFormData(releaseData.data);
		}
	}, [releaseData]);
	useEffect(() => {
		const controller = new AbortController();
		const signal = controller.signal;

		const fetchasignations = async () => {
			if (user) {
				try {
					const response = await fetch(
						`/api/admin/getAllAsignaciones/${user._id}`,
						{ signal }
					);
					const data = await response.json();
					setAsignedArtists(data.data);
				} catch (error) {
					if (error instanceof Error && error.name === 'AbortError') {
						console.log('Fetch aborted');
					} else {
						console.error('Error fetching asignations:', error);
					}
				}
			}
		};
		fetchasignations();

		return () => {
			controller.abort(); // Cancela la petición cuando el componente se desmonta
		};
	}, [user]);

	useEffect(() => {
		const controller = new AbortController();
		const signal = controller.signal;

		const fetchData = async () => {
			try {
				// Fetch genres
				const genresRes = await fetch('/api/admin/getAllGenres', { signal });
				const genresData = await genresRes.json();
				if (genresData.success && Array.isArray(genresData.data)) {
					setGenres(genresData.data);
				}
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') {
					console.log('Fetch aborted');
				} else {
					console.error('Error fetching data:', error);
				}
			}
		};
		fetchData();

		return () => {
			controller.abort(); // Cancela la petición cuando el componente se desmonta
		};
	}, []);

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
		const ex_ID = releaseData?.data?.external_id;
		const response = await fetch(`/api/admin/updateRelease/${ex_ID}`, {
			method: 'PUT',
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
	const uploadFileByChunks = async (file: File, trackData: any) => {
		const chunks = createChunks(file);
		let lastResponse = null;

		for (let i = 0; i < chunks.length; i++) {
			const { chunk, index, total } = chunks[i];
			lastResponse = await uploadChunk(
				chunk,
				index,
				total,
				trackData,
				file.name
			);
		}

		return lastResponse;
	};
	const handleSave = async (e: any, updatedRelease: Release) => {
		e.preventDefault();
		setArtistsErrors([]);
		setError(null);
		setIsLoading(true);
		setUploadProgress(null);
		setIsLoading(true);
		setIsProcessing(true);

		try {
			const formData = new FormData();

			const releaseData = {
				...updatedRelease,
				tracks: updatedRelease.tracks?.map(track => ({
					title: track.title,
					resource: track.resource,
					external_id: track.external_id ? Number(track.external_id) : 0,
				})),
			};

			// Si la imagen es un archivo, agrégala como 'picture'
			const picture = updatedRelease.picture;
			if (user && user.role !== 'admin') {
				if (releaseData.artists && releaseData.artists.length > 0) {
					const allArtists = [
						...releaseData.artists,
						...(releaseData.newArtists || []),
					];

					const hasAssignedArtist = allArtists.some(artist =>
						asignedArtists.some(
							(a: AsignedArtist) => a.artista_id.external_id === artist.artist
						)
					);

					if (!hasAssignedArtist) {
						setArtistsErrors(prev => [
							...prev,
							'Debe tener almenos un artista asignado en el Producto',
						]);
						toast.error(
							'Debe tener almenos un artista asignado en el Producto'
						);
					}
				}
			}
			if (picture instanceof File) {
				if (picture.type && picture.type !== 'image/jpeg') {
					throw new Error('El archivo debe ser JPEG');
				}

				const totalChunks = picture
					? Math.ceil(picture.size / (250 * 1024))
					: 0;

				setUploadProgress({
					total: picture ? 1 : 0, // 1 archivo
					loaded: 0,
					percentage: 0,
					totalChunks: totalChunks,
					filesCompleted: 0, // Empezar en 0, no en 1
				});

				const createResponse = await uploadFileByChunks(picture, releaseData);
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
				} else {
					toast.success('Release actualizado correctamente');
					return;
				}
			}
			if (picture && typeof picture === 'object') {
				// Si es el objeto picture original, mantenerlo como está
				releaseData.picture = picture;

				// Agregar los datos del release
				formData.append('data', JSON.stringify(releaseData));

				const response = await fetch(
					`/api/admin/updateRelease/${updatedRelease.external_id}`,
					{
						method: 'PUT',
						body: formData,
					}
				);
				const data = await response.json();
				if (!response.ok) {
					const errorMessage =
						typeof data.error === 'object'
							? Object.entries(data.error)
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
							: data.error;
					setError(errorMessage);
					throw new Error(errorMessage);
				}

				if (data.success) {
					// Si tenemos datos en la respuesta, los usamos
					if (data.data) {
						// Asegurarnos de que los datos sean serializables
						const serializedData = {
							...data.data,
							tracks: data.data.tracks || [],
							artists: data.data.artists || [],
							newArtists: data.data.newArtists || [],
						};
						setFormData(serializedData);
					} else {
						// Si no hay datos en la respuesta, mantenemos los datos actuales
						setFormData(prev => ({
							...prev,
						}));
					}

					toast.success('Release actualizado correctamente');
					await mutateRelease();
					router.refresh();
				} else {
					let errorMessage = 'Error al actualizar el release';

					if (typeof data === 'string') {
						errorMessage = data;
					} else if (data && typeof data === 'object') {
						if (Array.isArray(data.error)) {
							errorMessage = data.error.join('\n');
						} else if (data.error) {
							errorMessage = data.error;
						} else if (data.message) {
							errorMessage = data.message;
						}
					}

					toast.error(errorMessage);
				}
			}
		} catch (error) {
			console.log('CATCH error: ', error);
			toast.error(
				error instanceof Error ? error.message : 'Error al procesar la imagen'
			);
		} finally {
			setIsLoading(false);
			setArtistsErrors([]);
			setError(null);
			setUploadProgress(null);
			setIsProcessing(false);
		}
	};

	const handleEditTrack = async (track: any) => {
		try {
			// Si es un track nuevo (sin external_id), manejarlo directamente
			if (!track.external_id || track.external_id === 'undefined') {
				setSelectedTrack(track);
				setEditedTrackData(track);
				setActiveTab('tracks');
				return;
			}

			// Buscar el track en tracksData
			const trackExternalId = Number(track.external_id);
			const existingTrack = Array.isArray(tracksData?.data)
				? tracksData.data.find((t: Track) => t.external_id === trackExternalId)
				: null;

			if (existingTrack) {
				setSelectedTrack(existingTrack);
				setEditedTrackData(existingTrack);
				setActiveTab('tracks');
				return;
			}

			const response = await fetch(
				`/api/admin/getTrackById/${track.external_id}`
			);
			const data = await response.json();

			if (!data.success) {
				throw new Error('Error al obtener los datos del track');
			}

			// Usar los datos completos del track
			const trackToEdit = data.data;
			setSelectedTrack(trackToEdit);
			setEditedTrackData(trackToEdit);
			setActiveTab('tracks');
		} catch (error) {
			console.error('Error al cargar los datos del track:', error);
			toast.error('Error al cargar los datos del track');
		}
	};

	if (releaseData?.data) {
		return (
			<div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-full">
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
					<button
						onClick={() => setActiveTab('details')}
						className={`w-full sm:w-auto px-4 py-2.5 rounded-md text-sm sm:text-base font-medium ${
							activeTab === 'details'
								? 'bg-brand-light text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}
					>
						Detalles
					</button>
					<button
						onClick={() => setActiveTab('tracks')}
						className={`w-full sm:w-auto px-4 py-2.5 rounded-md text-sm sm:text-base font-medium ${
							activeTab === 'tracks'
								? 'bg-brand-light text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}
					>
						Tracks
					</button>
				</div>

				{activeTab === 'details' ? (
					<>
						<div className="w-full overflow-x-auto bg-white sm:mx-0 p-0 md:px-3  sm:px-0">
							<UpdateReleasePage
								artistsErrors={artistsErrors}
								release={formData}
								formData={formData}
								setFormData={setFormData}
								onEditTrack={handleEditTrack}
								genres={genres}
								mutateTracks={mutateTracks as () => Promise<void>}
								onTracksUpdated={mutateTracks as () => Promise<void>}
							/>
						</div>
						{error && error.length > 0 && (
							<div className="mb-4 p-4 bg-red-200 text-red-700 rounded-md">
								{error}
							</div>
						)}

						<div className="flex justify-end mt-4 sm:mt-6">
							<button
								type="button"
								onClick={e => handleSave(e, formData)}
								disabled={isLoading}
								className="w-full sm:w-auto px-4 py-2.5 text-brand-light rounded-md flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium hover:bg-gray-50"
							>
								{isLoading ? (
									<div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
								) : (
									<Save className="w-4 h-4 sm:w-5 sm:h-5" />
								)}
								<span className="group-hover:text-brand-dark">
									{isLoading ? 'Actualizando...' : 'Actualizar'}
								</span>
							</button>
						</div>
					</>
				) : (
					<div className="w-full overflow-x-auto sm:mx-0 px-3 sm:px-0">
						<TrackForm
							track={selectedTrack || undefined}
							genres={genres}
							onClose={() => {
								setSelectedTrack(null);
							}}
							isAsset={false}
						/>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="flex justify-center items-center h-screen">
			<Spinner />
		</div>
	);
}
