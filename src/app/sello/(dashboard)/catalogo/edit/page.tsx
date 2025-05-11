'use client';

import { useState } from 'react';
import UpdateReleasePage from '@/components/UpdateReleaseModal';
import UpdateTrackPage from '@/components/UpdateTrackModal';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Release, ReleaseResponse } from '@/types/release';
import { Track, TrackResponse } from '@/types/track';

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
	const [activeTab, setActiveTab] = useState<'release' | 'track'>('release');
	const releaseId = searchParams.get('releaseId');

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

	const handleReleaseSave = async (updatedRelease: Release) => {
		try {
			const response = await fetch(`/api/admin/updateRelease/${releaseId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updatedRelease),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Error al actualizar el release');
			}

			await mutateRelease();
		} catch (error) {
			console.error('Error saving release:', error);
			throw error;
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

	if (!releaseId) {
		return (
			<div className="flex justify-center items-center h-screen">
				<p className="text-red-500">
					No se ha especificado un ID de lanzamiento
				</p>
			</div>
		);
	}

	if (releaseError || tracksError) {
		return (
			<div className="flex justify-center items-center h-screen">
				<p className="text-red-500">
					{(releaseError as ApiError)?.info?.message ||
						(tracksError as ApiError)?.info?.message ||
						'Error al cargar los datos'}
				</p>
			</div>
		);
	}

	if (!releaseData?.data) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-light"></div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4">
			<div className="mb-6">
				<div className="border-b border-gray-200">
					<nav className="-mb-px flex space-x-8">
						<button
							type="button"
							onClick={() => setActiveTab('release')}
							className={`${
								activeTab === 'release'
									? 'border-brand-light text-brand-light'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
						>
							Editar Lanzamiento
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('track')}
							className={`${
								activeTab === 'track'
									? 'border-brand-light text-brand-light'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
						>
							Editar Track
						</button>
					</nav>
				</div>
			</div>

			{activeTab === 'release' ? (
				<UpdateReleasePage
					release={releaseData.data}
					onSave={handleReleaseSave}
				/>
			) : (
				<div className="space-y-4">
					{tracksData?.data &&
						Array.isArray(tracksData.data) &&
						tracksData.data.map(track => (
							<UpdateTrackPage
								key={track._id}
								track={track}
								onSave={handleTrackSave}
							/>
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
