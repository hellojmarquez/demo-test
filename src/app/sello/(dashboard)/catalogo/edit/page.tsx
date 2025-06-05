'use client';

import { useState, useEffect } from 'react';
import UpdateReleasePage from '@/components/UpdateReleaseModal';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Release, ReleaseResponse, Picture } from '@/types/release';
import { Track, TrackResponse } from '@/types/track';
import { toast } from 'react-hot-toast';
import TrackForm, { GenreData } from '@/components/CreateTrackModal';
import { Save } from 'lucide-react';

interface ApiError extends Error {
	info?: any;
	status?: number;
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
	const router = useRouter();
	const [activeTab, setActiveTab] = useState('details');
	const releaseId = searchParams?.get('releaseId') || null;
	const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
	const [editedTrackData, setEditedTrackData] = useState<Partial<Track> | null>(
		null
	);
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
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});

	const {
		data: releaseData,
		error: releaseError,
		mutate: mutateRelease,
	} = useSWR<ReleaseResponse>(
		releaseId ? `/api/admin/getReleaseById/${releaseId}` : null,
		fetcher
	);

	const {
		data: tracksData,
		error: tracksError,
		mutate: mutateTracks,
	} = useSWR<TrackResponse>(
		releaseId ? `/api/admin/getTracksByRelease/${releaseId}` : null,
		fetcher
	);

	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (releaseData?.data) {
			setFormData(releaseData.data);
		}
	}, [releaseData]);

	const fetchData = async () => {
		try {
			// Fetch genres
			const genresRes = await fetch('/api/admin/getAllGenres');
			const genresData = await genresRes.json();
			if (genresData.success && Array.isArray(genresData.data)) {
				setGenres(genresData.data);
			}

			// Fetch publishers for logging
			const publishersRes = await fetch('/api/admin/getAllPublishers');
			const publishersData = await publishersRes.json();
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleTrackSave = async (trackData: Track) => {
		try {
			const formData = new FormData();
			formData.append('file', trackData.resource as File);
			formData.append('data', JSON.stringify(trackData));

			const response = await fetch('/api/admin/createSingle', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Error al guardar el track');
			}

			// Refrescar los datos del release después de guardar el track
			await mutateRelease();
			toast.success('Track guardado correctamente');
		} catch (error) {
			console.error('Error al guardar el track:', error);
			toast.error('Error al guardar el track');
			throw error;
		}
	};

	const handleSave = async (updatedRelease: Release) => {
		setIsLoading(true);
		try {
			const formData = new FormData();

			// Preparar los datos del release manteniendo la estructura original de tracks[]
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
			if (picture instanceof File) {
				formData.append('picture', picture);
			} else if (picture && typeof picture === 'object') {
				// Si es el objeto picture original, mantenerlo como está
				releaseData.picture = picture;
			}

			// Agregar los datos del release
			formData.append('data', JSON.stringify(releaseData));
			console.log('FORM DATA A ENVIAR: ', formData);
			const response = await fetch(
				`/api/admin/updateRelease/${updatedRelease.external_id}`,
				{
					method: 'PUT',
					body: formData,
				}
			);

			const data = await response.json();
			if (data.success) {
				// Si tenemos datos en la respuesta, los usamos
				if (data.data) {
					// Asegurarnos de que los datos sean serializables
					const serializedData = {
						...data.data,
						tracks: data.data.tracks || [],
						artists: data.data.artists || [],
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
		} catch (error) {
			console.error('Error updating release:', error);
			toast.error('Error al actualizar el release');
		} finally {
			setIsLoading(false);
		}
	};
	useEffect(() => {
		console.log('tracksData', tracksData);
	}, [tracksData]);
	const handleEditTrack = async (track: any) => {
		try {
			// Si es un track nuevo (sin external_id), manejarlo directamente
			if (!track.external_id || track.external_id === 'undefined') {
				console.log('Editando track nuevo');
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
				console.log('Usando versión existente del track:', existingTrack);
				setSelectedTrack(existingTrack);
				setEditedTrackData(existingTrack);
				setActiveTab('tracks');
				return;
			}

			// Si no está en tracksData, hacer fetch al backend
			console.log(
				'Track no encontrado en tracksData, buscando en el backend...'
			);
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
								release={formData}
								onSave={handleSave}
								formData={formData}
								setFormData={setFormData}
								onEditTrack={handleEditTrack}
								genres={genres}
							/>
						</div>
						<div className="flex justify-end mt-4 sm:mt-6">
							<button
								type="button"
								onClick={() => handleSave(formData)}
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
						/>
					</div>
				)}
			</div>
		);
	}

	return <div>Cargando...</div>;
}
