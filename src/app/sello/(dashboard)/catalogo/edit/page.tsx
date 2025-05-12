'use client';

import { useState, useEffect } from 'react';
import UpdateReleasePage from '@/components/UpdateReleaseModal';
import UpdateTrackModal from '@/components/UpdateTrackModal';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Release, ReleaseResponse } from '@/types/release';
import { Track, TrackResponse } from '@/types/track';
import { toast } from 'react-hot-toast';

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
	const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
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
		publisher: '',
		publisher_year: '',
		copyright_holder: '',
		copyright_holder_year: '',
		genre: 0,
		subgenre: 0,
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

	const handleSave = async (updatedRelease: Release) => {
		console.log('updatedRelease', updatedRelease);
		try {
			const formData = new FormData();
			// Si la imagen es un archivo, agrégala como 'picture'
			if (
				updatedRelease.picture &&
				typeof updatedRelease.picture !== 'string'
			) {
				formData.append('picture', updatedRelease.picture);
				// Elimina la propiedad picture del objeto para no duplicar
				const { picture, ...rest } = updatedRelease;
				formData.append('data', JSON.stringify(rest));
			} else {
				formData.append('data', JSON.stringify(updatedRelease));
			}

			const response = await fetch(`/api/admin/updateRelease/${releaseId}`, {
				method: 'PUT',
				body: formData,
			});

			const data = await response.json();
			if (data.success) {
				setFormData(data.data);
				toast.success('Release actualizado correctamente');
				await mutateRelease();
			} else {
				toast.error(data.message || 'Error al actualizar el release');
			}
		} catch (error) {
			console.error('Error updating release:', error);
			toast.error('Error al actualizar el release');
		}
	};

	const handleTrackSave = async (updatedTrack: Track) => {
		try {
			const response = await fetch(
				`/api/admin/updateTrack/${updatedTrack._id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(updatedTrack),
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Error al actualizar el track');
			}

			await mutateTracks();
		} catch (error) {
			console.error('Error saving track:', error);
			throw error;
		}
	};

	const handleAddTrack = async () => {
		try {
			const response = await fetch(`/api/admin/createTrack`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					release: releaseId,
					name: 'Nuevo Track',
					order: tracksData?.data ? (tracksData.data as Track[]).length : 0,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Error al crear el track');
			}

			await mutateTracks();
		} catch (error) {
			console.error('Error creating track:', error);
			throw error;
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
						formData={formData}
						setFormData={setFormData}
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
				<div className="space-y-4">
					{tracksData?.data &&
						Array.isArray(tracksData.data) &&
						tracksData.data.map(track => (
							<div
								key={track._id}
								className="flex items-center justify-between p-4 border-b"
							>
								<div>
									<h3 className="text-lg font-medium">{track.name}</h3>
									<p className="text-sm text-gray-500">{track.mix_name}</p>
								</div>
								<button
									onClick={() => {
										setSelectedTrack(track);
										setIsTrackModalOpen(true);
									}}
									className="px-4 py-2 text-sm font-medium text-white bg-brand-light rounded-md hover:bg-brand-dark"
								>
									Editar
								</button>
								<UpdateTrackModal
									key={track._id}
									track={track}
									onSave={handleTrackSave}
									isOpen={selectedTrack?._id === track._id && isTrackModalOpen}
									onClose={() => {
										setIsTrackModalOpen(false);
										setSelectedTrack(null);
									}}
								/>
							</div>
						))}
					<button
						type="button"
						onClick={handleAddTrack}
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-light hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
					>
						Agregar Nuevo Track
					</button>
				</div>
			)}
		</div>
	);
}
