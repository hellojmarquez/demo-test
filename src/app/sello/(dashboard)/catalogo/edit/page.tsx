'use client';

import { useState, useEffect } from 'react';
import UpdateReleasePage from '@/components/UpdateReleaseModal';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Release, ReleaseResponse } from '@/types/release';
import { Track, TrackResponse } from '@/types/track';
import { toast } from 'react-hot-toast';
import TrackForm, { GenreData } from '@/components/CreateTrackModal';

interface ReleaseTrack {
	title: string;
	resource: string;
	external_id: number;
}

interface EditedTrack {
	_id?: string;
	name?: string;
	mix_name?: string;
	DA_ISRC?: string;
	ISRC?: string;
	album_only?: boolean;
	artists?: { artist: number; kind: string; order: number; name: string }[];
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
	resource?: string | File | null;
	sample_start?: string;
	track_lenght?: string;
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
	const releaseId = searchParams.get('releaseId');
	const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
	const [editedTrackData, setEditedTrackData] = useState<Partial<Track> | null>(
		null
	);
	const [genres, setGenres] = useState<GenreData[]>([]);
	const [formData, setFormData] = useState<Release>({
		_id: '',

		name: '',
		picture: '',
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
	const [isLoading, setIsLoading] = useState(true);

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
			setIsLoading(false);
		}
	}, [releaseData]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch genres
				const genresRes = await fetch('/api/admin/getAllGenres');
				const genresData = await genresRes.json();
				if (genresData.success && Array.isArray(genresData.data)) {
					setGenres(genresData.data);
				}
			} catch (error) {
				console.error('Error fetching genres:', error);
			}
		};

		fetchData();
	}, []);

	const handleTrackSave = async (trackData: Partial<Track>) => {
		try {
			if (!trackData.external_id) {
				throw new Error('Track no encontrado');
			}

			const trackId = Number(trackData.external_id);
			if (isNaN(trackId)) {
				throw new Error('ID de track inválido');
			}

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
			toast.success('Track actualizado correctamente');
		} catch (error) {
			console.error('Error saving track:', error);
			toast.error('Error al actualizar el track');
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
			if (
				updatedRelease.picture &&
				typeof updatedRelease.picture !== 'string'
			) {
				formData.append('picture', updatedRelease.picture);
			}

			// Agregar los tracks editados
			if (editedTracks.length > 0) {
				formData.append('editedTracks', JSON.stringify(editedTracks));
			}

			// Agregar los datos del release
			formData.append('data', JSON.stringify(releaseData));

			console.log('editedTracks antes de enviar:', editedTracks);
			console.log('formData completo:', {
				releaseData,
				editedTracks,
			});

			// const response = await fetch(`/api/admin/updateRelease/${releaseId}`, {
			// 	method: 'PUT',
			// 	body: formData,
			// });

			// const data = await response.json();
			// if (data.success) {
			// 	setFormData(data.data);
			// 	// Limpiar los tracks editados después de guardar exitosamente
			// 	setEditedTracks([]);
			// 	toast.success('Release actualizado correctamente');
			// 	await mutateRelease();
			// } else {
			// 	toast.error(data.message || 'Error al actualizar el release');
			// }
		} catch (error) {
			console.error('Error updating release:', error);
			toast.error('Error al actualizar el release');
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

			// Solo hacer fetch si tiene external_id válido
			console.log('Editando track existente con ID:', track.external_id);
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

	if (isLoading || !formData) {
		return <div>Cargando...</div>;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex space-x-4 mb-6">
				<button
					onClick={() => setActiveTab('details')}
					className={`px-4 py-2 rounded-md ${
						activeTab === 'details'
							? 'bg-brand-light text-white'
							: 'bg-gray-200 text-gray-700'
					}`}
				>
					Detalles
				</button>
				<button
					onClick={() => setActiveTab('tracks')}
					className={`px-4 py-2 rounded-md ${
						activeTab === 'tracks'
							? 'bg-brand-light text-white'
							: 'bg-gray-200 text-gray-700'
					}`}
				>
					Tracks
				</button>
			</div>

			{activeTab === 'details' ? (
				<>
					<UpdateReleasePage
						release={formData}
						onSave={handleSave}
						formData={
							selectedTrack
								? {
										...formData,
										name: selectedTrack.name || '',
										genre: selectedTrack.genre || 0,
										genre_name: selectedTrack.genre_name || '',
										subgenre: selectedTrack.subgenre || 0,
										subgenre_name: selectedTrack.subgenre_name || '',
										copyright_holder: selectedTrack.copyright_holder || '',
										copyright_holder_year:
											selectedTrack.copyright_holder_year || '',
										language: selectedTrack.language || '',
										artists: selectedTrack.artists || [],
										tracks: formData.tracks,
										// Mantener el resto de las propiedades del release
										_id: formData._id,
										picture: formData.picture,
										external_id: formData.external_id,
										auto_detect_language: formData.auto_detect_language,
										generate_ean: formData.generate_ean,
										backcatalog: formData.backcatalog,
										youtube_declaration: formData.youtube_declaration,
										dolby_atmos: formData.dolby_atmos,
										countries: formData.countries,
										catalogue_number: formData.catalogue_number,
										kind: formData.kind,
										label: formData.label,
										label_name: formData.label_name,
										release_version: formData.release_version,
										publisher: formData.publisher,
										publisher_name: formData.publisher_name,
										publisher_year: formData.publisher_year,
										artwork: formData.artwork,
										is_new_release: formData.is_new_release,
										official_date: formData.official_date,
										original_date: formData.original_date,
										exclusive_shop: formData.exclusive_shop,
										territory: formData.territory,
										ean: formData.ean,
										createdAt: formData.createdAt,
										updatedAt: formData.updatedAt,
								  }
								: formData
						}
						setFormData={setFormData}
						onEditTrack={handleEditTrack}
						genres={genres}
					/>
					<div className="flex justify-end space-x-3 mt-6">
						<button
							type="button"
							disabled={isLoading}
							onClick={() => handleSave(formData)}
							className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<>
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
									<span>Actualizando...</span>
								</>
							) : (
								<>
									<span className="group-hover:text-brand-dark">
										Actualizar
									</span>
								</>
							)}
						</button>
					</div>
				</>
			) : (
				<TrackForm
					track={selectedTrack || undefined}
					onTrackChange={(updatedTrack: Partial<Track>) => {
						setSelectedTrack(updatedTrack as Track);
						setEditedTrackData(updatedTrack);
					}}
					onSave={async trackData => {
						if (selectedTrack) {
							// Si estamos editando un track existente
							const trackExternalId = Number(selectedTrack.external_id);

							// Actualizar editedTracks con la última versión del track
							setEditedTracks(prev => {
								// Filtrar tracks anteriores con el mismo external_id
								const filteredTracks = prev.filter(
									t => t.external_id !== trackExternalId
								);

								const completeTrack: EditedTrack = {
									...selectedTrack,
									...trackData,
									external_id: trackExternalId,
									label_share: trackData.label_share
										? Number(trackData.label_share)
										: undefined,
								};

								// Agregar solo la última versión del track
								return [...filteredTracks, completeTrack];
							});

							await handleTrackSave(trackData);
							setEditedTrackData(trackData);
						} else {
							// Si estamos creando un nuevo track
							const formDataToSend = new FormData();
							formDataToSend.append('release', formData._id || '');
							formDataToSend.append('order', String(trackData.order || 0));
							formDataToSend.append('name', trackData.name || '');
							formDataToSend.append('mix_name', trackData.mix_name || '');
							formDataToSend.append('genre', String(trackData.genre || 0));
							formDataToSend.append(
								'copyright_holder',
								trackData.copyright_holder || ''
							);

							if (trackData.resource instanceof File) {
								formDataToSend.append('file', trackData.resource);
							}

							const response = await fetch('/api/admin/createTrackInRelease', {
								method: 'POST',
								body: formDataToSend,
							});

							if (!response.ok) {
								throw new Error('Error al crear el track');
							}

							const data = await response.json();
							if (data.success) {
								setFormData(prev => ({
									...prev,
									tracks: [...(prev.tracks || []), data.data],
								}));
							}
						}
						// Limpiar el track seleccionado después de guardar
						setSelectedTrack(null);
						setEditedTrackData(null);
					}}
					genres={genres}
					onClose={() => {
						setSelectedTrack(null);
						setEditedTrackData(null);
					}}
				/>
			)}
		</div>
	);
}
