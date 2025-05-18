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
import { Save } from 'lucide-react';

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
			// Si es un track nuevo (sin external_id), lo manejamos diferente
			if (!trackData.external_id) {
				// Actualizar el track en newTracks
				setFormData(prev => ({
					...prev,
					newTracks:
						prev.newTracks?.map(t =>
							t.title === trackData.name
								? {
										...t,
										title: trackData.name || '',
										mixName: trackData.mix_name || '',
										order: trackData.order || 0,
										resource: (trackData.resource as string) || '',
										dolby_atmos_resource: trackData.dolby_atmos_resource || '',
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
								  }
								: t
						) || [],
				}));
				return;
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
				editedTracks: editedTracks,
				newTracks: updatedRelease.newTracks || [],
			};

			// Si la imagen es un archivo, agrégala como 'picture'
			if (
				updatedRelease.picture &&
				typeof updatedRelease.picture !== 'string'
			) {
				formData.append('picture', updatedRelease.picture);
			}

			// Agregar los datos del release
			formData.append('data', JSON.stringify(releaseData));

			console.log('formData completo:', {
				releaseData,
			});

			const response = await fetch(`/api/admin/updateRelease/${releaseId}`, {
				method: 'PUT',
				body: formData,
			});

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
				toast.error(data.message || 'Error al actualizar el release');
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
							formData={formData}
							setFormData={setFormData}
							onEditTrack={handleEditTrack}
							genres={genres}
						/>
						<div className="flex justify-end space-x-3 mt-6">
							<button
								type="button"
								onClick={() => handleSave(formData)}
								className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<span className="group-hover:text-brand-dark">Actualizar</span>
							</button>
						</div>
					</>
				) : (
					<TrackForm
						track={selectedTrack || undefined}
						onTrackChange={(updatedTrack: Partial<Track>) => {
							// Actualizar el track seleccionado
							setSelectedTrack(updatedTrack as Track);
							setEditedTrackData(updatedTrack);

							// Si es un track nuevo (sin external_id), actualizarlo en newTracks
							if (!updatedTrack.external_id) {
								setFormData(prev => ({
									...prev,
									newTracks: [
										{
											title: updatedTrack.name || '',
											mixName: updatedTrack.mix_name || '',
											order: updatedTrack.order || 0,
											resource: (updatedTrack.resource as string) || '',
											dolby_atmos_resource:
												updatedTrack.dolby_atmos_resource || '',
											ISRC: updatedTrack.ISRC || '',
											DA_ISRC: updatedTrack.DA_ISRC || '',
											genre: updatedTrack.genre || 0,
											genre_name: updatedTrack.genre_name || '',
											subgenre: updatedTrack.subgenre || 0,
											subgenre_name: updatedTrack.subgenre_name || '',
											album_only: updatedTrack.album_only || false,
											explicit_content: updatedTrack.explicit_content || false,
											track_length: updatedTrack.track_length || '',
											generate_isrc: updatedTrack.generate_isrc || false,
											artists: updatedTrack.artists || [],
										},
									],
								}));
							}
						}}
						onSave={async trackData => {
							try {
								if (selectedTrack) {
									// Si estamos editando un track existente
									const trackExternalId = Number(selectedTrack.external_id);

									// Solo agregar a editedTracks si el track tiene un external_id válido
									if (trackExternalId && !isNaN(trackExternalId)) {
										setEditedTracks(prev => {
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

											return [...filteredTracks, completeTrack];
										});
									}

									await handleTrackSave(trackData);
									setEditedTrackData(trackData);
								} else {
									// Si estamos creando un nuevo track
									setFormData(prev => {
										// Si no existe newTracks, lo inicializamos
										if (!prev.newTracks) {
											return {
												...prev,
												newTracks: [
													{
														title: trackData.name || '',
														mixName: trackData.mix_name || '',
														order: trackData.order || 0,
														resource: (trackData.resource as string) || '',
														dolby_atmos_resource:
															trackData.dolby_atmos_resource || '',
														ISRC: trackData.ISRC || '',
														DA_ISRC: trackData.DA_ISRC || '',
														genre: trackData.genre || 0,
														genre_name: trackData.genre_name || '',
														subgenre: trackData.subgenre || 0,
														subgenre_name: trackData.subgenre_name || '',
														album_only: trackData.album_only || false,
														explicit_content:
															trackData.explicit_content || false,
														track_length: trackData.track_length || '',
														generate_isrc: trackData.generate_isrc || false,
														artists: trackData.artists || [],
													},
												],
											};
										}

										// Si el track ya existe en newTracks, lo actualizamos
										const existingTrackIndex = prev.newTracks.findIndex(
											t => t.title === trackData.name
										);

										if (existingTrackIndex >= 0) {
											const updatedTracks = [...prev.newTracks];
											updatedTracks[existingTrackIndex] = {
												...updatedTracks[existingTrackIndex],
												title: trackData.name || '',
												mixName: trackData.mix_name || '',
												order: trackData.order || 0,
												resource: (trackData.resource as string) || '',
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
											};
											return {
												...prev,
												newTracks: updatedTracks,
											};
										}

										// Si es un track completamente nuevo, lo agregamos
										return {
											...prev,
											newTracks: [
												...prev.newTracks,
												{
													title: trackData.name || '',
													mixName: trackData.mix_name || '',
													order: trackData.order || 0,
													resource: (trackData.resource as string) || '',
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
												},
											],
										};
									});

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
				)}
			</div>
		);
	}

	return <div>Cargando...</div>;
}
