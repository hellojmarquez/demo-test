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

interface ReleaseTrack {
	title: string;
	resource: string | File;
	external_id: number;
}

interface EditedTrack {
	_id?: string;
	name?: string;
	mix_name?: string;
	DA_ISRC?: string;
	ISRC?: string;
	album_only?: boolean;
	artists?: {
		artist: number;
		kind: string;
		order: number;
		name: string;
	}[];
	newArtists?: {
		artist: number;
		kind: string;
		order: number;
		name: string;
		amazon_music_identifier?: string;
		apple_identifier?: string;
		deezer_identifier?: string;
		email?: string;
		spotify_identifier?: string;
	}[];
	contributors?: any[];
	copyright_holder?: string;
	copyright_holder_year?: string;
	dolby_atmos_resource?: string;
	explicit_content?: boolean;
	generate_isrc?: boolean;
	genre: number;
	genre_name: string;
	subgenre: number;
	subgenre_name: string;
	label_share?: number;
	language?: string;
	order?: number;
	publishers?: any[];
	release?: string | null;
	resource?: File | string | null;
	sample_start?: string;
	track_length?: string;
	vocals?: string;
	external_id: number;
	status?: string;
}

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
	const [editedTracks, setEditedTracks] = useState<EditedTrack[]>([]);

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
			console.log('Publishers response in edit page:', publishersData);
			console.log('Publishers data:', publishersData.data);
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleTrackSave = async (trackData: Partial<Track>) => {
		try {
			// Si es un track nuevo (sin external_id), lo manejamos diferente
			if (!trackData.external_id) {
				// Separar artistas originales de nuevos artistas para el track nuevo
				const originalArtists =
					trackData.artists?.filter(artist => artist.artist !== 0) || [];
				const newArtists =
					trackData.artists?.filter(artist => artist.artist === 0) || [];

				// Actualizar el track en newTracks
				setFormData(prev => ({
					...prev,
					newTracks: [
						{
							title: trackData.name || '',
							mixName: trackData.mix_name || '',
							order: trackData.order || 0,
							resource:
								trackData.resource instanceof File ? trackData.resource : '',
							dolby_atmos_resource: trackData.dolby_atmos_resource || '',
							ISRC: trackData.ISRC || '',
							copyright_holder: trackData.copyright_holder || '',
							copyright_holder_year: trackData.copyright_holder_year || '',
							DA_ISRC: trackData.DA_ISRC || '',
							genre: trackData.genre || 0,
							genre_name: trackData.genre_name || '',
							subgenre: trackData.subgenre || 0,
							subgenre_name: trackData.subgenre_name || '',
							album_only: trackData.album_only || false,
							explicit_content: trackData.explicit_content || false,
							track_length: trackData.track_length || '',
							generate_isrc: trackData.generate_isrc || true,
							artists: originalArtists,
							newArtists: newArtists,
							publishers: trackData.publishers || [],
							contributors: trackData.contributors || [],
						},
					],
				}));
				return;
			}

			const trackId = Number(trackData.external_id);
			if (isNaN(trackId)) {
				throw new Error('ID de track inválido');
			}

			// Separar artistas originales de nuevos artistas
			const originalArtists =
				trackData.artists?.filter(artist => artist.artist !== 0) || [];
			const newArtists =
				trackData.artists?.filter(artist => artist.artist === 0) || [];

			// Convertir trackData a EditedTrack
			const editedTrack: EditedTrack = {
				...trackData,
				external_id: trackId,
				genre: trackData.genre || 0,
				subgenre: trackData.subgenre || 0,
				genre_name: trackData.genre_name || '',
				subgenre_name: trackData.subgenre_name || '',
				label_share: trackData.label_share
					? Number(trackData.label_share)
					: undefined,
				artists: originalArtists,
				newArtists: newArtists,
				publishers: trackData.publishers || [],
				contributors: trackData.contributors || [],
			};

			// Actualizar el track en editedTracks con toda la información modificada
			setEditedTracks(prev => {
				const existingTrackIndex = prev.findIndex(
					t => t.external_id === trackId
				);
				if (existingTrackIndex >= 0) {
					// Actualizar track existente
					const updatedTracks = [...prev];
					updatedTracks[existingTrackIndex] = editedTrack;
					return updatedTracks;
				} else {
					// Agregar nuevo track editado
					return [...prev, editedTrack];
				}
			});

			// No modificamos tracks[] aquí, esperamos la respuesta del backend
			await mutateTracks();
		} catch (error) {
			console.error('Error saving track:', error);
			throw error;
		}
	};

	const handleSave = async (updatedRelease: Release) => {
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

			// Agregar los archivos de los nuevos tracks
			if (updatedRelease.newTracks) {
				updatedRelease.newTracks.forEach(track => {
					if (track.resource instanceof File) {
						formData.append(`track_${track.resource.name}`, track.resource);
					}
				});
			}

			// Agregar los archivos de los tracks editados
			if (editedTracks) {
				editedTracks.forEach(track => {
					if (track.resource instanceof File) {
						formData.append(
							`edited_track_${track.external_id}`,
							track.resource
						);
					}
				});
			}

			// Agregar los datos del release
			formData.append('data', JSON.stringify(releaseData));

			console.log('formData completo:', {
				releaseData,
				picture: picture instanceof File ? 'File' : picture,
				trackFiles: updatedRelease.newTracks?.map(track =>
					track.resource instanceof File
						? {
								name: track.resource.name,
								size: track.resource.size,
								type: track.resource.type,
						  }
						: track.resource
				),
			});

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
					setFormData(data.data);
				} else {
					// Si no hay datos en la respuesta, mantenemos los datos actuales
					setFormData(prev => ({
						...prev,
						newTracks: prev.newTracks || [],
					}));
				}
				// Limpiar los tracks editados después de guardar exitosamente
				setEditedTracks([]);
				toast.success('Release actualizado correctamente');
				await mutateRelease();
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
			throw error;
		}
	};

	const handleEditTrack = async (track: any) => {
		try {
			// Verificar si el track tiene external_id válido
			if (!track.external_id || track.external_id === 'undefined') {
				// Si no tiene external_id, es un track nuevo
				console.log('Editando track nuevo');
				setSelectedTrack(track);
				setEditedTrackData(track);
				setActiveTab('tracks');
				return;
			}

			// Primero buscar si el track está en editedTracks
			const trackExternalId = Number(track.external_id);
			const editedTrack = editedTracks.find(
				t => t.external_id === trackExternalId
			);

			if (editedTrack) {
				// Si encontramos el track en editedTracks, usar esa versión
				console.log('Usando versión editada del track:', editedTrack);
				setSelectedTrack(editedTrack as Track);
				setEditedTrackData(editedTrack);
				setActiveTab('tracks');
				return;
			}

			// Si no está en editedTracks, hacer fetch al backend
			console.log('Editando track existente con ID:', track.external_id);
			const response = await fetch(
				`/api/admin/getTrackById/${track.external_id}`
			);
			const data = await response.json();
			console.log('data: ', data);
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
								className="w-full sm:w-auto px-4 py-2.5 text-brand-light rounded-md flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium hover:bg-gray-50"
							>
								<Save className="w-4 h-4 sm:w-5 sm:h-5" />
								<span className="group-hover:text-brand-dark">Actualizar</span>
							</button>
						</div>
					</>
				) : (
					<div className="w-full overflow-x-auto sm:mx-0 px-3 sm:px-0">
						<TrackForm
							track={selectedTrack || undefined}
							onTrackChange={(updatedTrack: Partial<Track>) => {
								// Actualizar el track seleccionado
								// Si es un track nuevo (sin external_id), actualizarlo en newTracks
							}}
							onSave={async trackData => {
								try {
									if (selectedTrack) {
										// Si estamos editando un track existente
										const trackExternalId = Number(selectedTrack.external_id);

										await handleTrackSave(trackData);
										setEditedTrackData(trackData);
									} else {
										// Si estamos creando un nuevo track
										setFormData(prev => ({
											...prev,
											newTracks: [
												{
													title: trackData.name || '',
													mixName: trackData.mix_name || '',
													order: trackData.order || 0,
													resource:
														trackData.resource instanceof File
															? trackData.resource
															: '',
													dolby_atmos_resource:
														trackData.dolby_atmos_resource || '',
													ISRC: trackData.ISRC || '',
													DA_ISRC: trackData.DA_ISRC || '',
													genre: trackData.genre || 0,
													genre_name: trackData.genre_name || '',
													subgenre: trackData.subgenre || 0,
													subgenre_name: trackData.subgenre_name || '',
													album_only: trackData.album_only || false,
													explicit_content: trackData.explicit_content || false,
													track_length: trackData.track_length || '',
													generate_isrc: trackData.generate_isrc || false,
													artists: trackData.artists || [],
													publishers: trackData.publishers || [],
													contributors: trackData.contributors || [],
												},
											],
										}));

										toast.success('Track guardado correctamente');
									}
								} catch (error) {
									console.error('Error al guardar el track:', error);
									throw error;
								}
							}}
							genres={genres}
							onClose={() => {
								setSelectedTrack(null);
								setEditedTrackData(null);
							}}
						/>
					</div>
				)}
			</div>
		);
	}

	return <div>Cargando...</div>;
}
