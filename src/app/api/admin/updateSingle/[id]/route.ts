// app/api/admin/updateSingle/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import Release from '@/models/ReleaseModel';
import mongoose from 'mongoose';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await dbConnect();
		const trackId = params.id;
		const trackData = await req.json();
		console.log(trackData);

		// Obtener el track actual antes de actualizarlo
		const currentTrack = await SingleTrack.findById(trackId);

		if (!currentTrack) {
			return NextResponse.json(
				{ success: false, error: 'Track not found' },
				{ status: 404 }
			);
		}

		// Verificar si el track tiene un release actual y si el nuevo release es diferente o vacío
		const hasCurrentRelease =
			currentTrack.release && currentTrack.release.toString() !== '';
		const newReleaseIsEmpty =
			!trackData.release || trackData.release.trim() === '';
		const newReleaseIsDifferent =
			hasCurrentRelease &&
			trackData.release &&
			trackData.release.trim() !== '' &&
			currentTrack.release.toString() !== trackData.release;

		// Si el track tiene un release actual y el nuevo release es diferente o vacío
		if (hasCurrentRelease && (newReleaseIsEmpty || newReleaseIsDifferent)) {
			console.log(`Eliminando track ${trackId} del release anterior`);

			// Buscar el release actual
			const currentRelease = await Release.findById(currentTrack.release);
			if (currentRelease) {
				// Encontrar el índice del track en el array de tracks
				const trackIndex = currentRelease.tracks.findIndex(
					(track: any) => track.name === currentTrack.name
				);

				if (trackIndex !== -1) {
					// Eliminar el track del array usando $pull
					await Release.findByIdAndUpdate(currentTrack.release, {
						$pull: { tracks: { name: currentTrack.name } },
					});
				}
			}
		}

		// Si hay un release y no está vacío, convertir el string ID a ObjectId
		if (trackData.release && trackData.release.trim() !== '') {
			trackData.release = new mongoose.Types.ObjectId(trackData.release);
		} else {
			// Si el release está vacío, establecerlo como null
			trackData.release = null;
		}

		// Asegurarse de que el género tenga el formato correcto
		if (trackData.genre) {
			if (typeof trackData.genre === 'number') {
				trackData.genre = {
					id: trackData.genre,
					name: '',
				};
			} else if (typeof trackData.genre === 'object') {
				trackData.genre = {
					id: trackData.genre.id || 0,
					name: trackData.genre.name || '',
				};
			}
		} else {
			trackData.genre = null;
		}

		// Asegurarse de que el subgénero tenga el formato correcto
		if (trackData.subgenre) {
			if (typeof trackData.subgenre === 'number') {
				trackData.subgenre = {
					id: trackData.subgenre,
					name: '',
				};
			} else if (typeof trackData.subgenre === 'object') {
				trackData.subgenre = {
					id: trackData.subgenre.id || 0,
					name: trackData.subgenre.name || '',
				};
			}
		} else {
			trackData.subgenre = null;
		}

		// Actualizar el track
		const updatedTrack = await SingleTrack.findByIdAndUpdate(
			trackId,
			trackData,
			{ new: true }
		);

		// Si el track tiene una propiedad release válida, actualizar el release correspondiente
		if (trackData.release) {
			const release = await Release.findById(trackData.release);

			if (release) {
				// Crear el objeto del track para agregar al release según el esquema
				const trackInfo = {
					order: Number(release.tracks.length + 1),
					name: String(updatedTrack.name || ''),
					artists: Array.isArray(updatedTrack.artists)
						? updatedTrack.artists.map((artist: any) => ({
								order: Number(artist.order || 0),
								artist: Number(artist.artist || 0),
								kind: String(artist.kind || 'main'),
						  }))
						: [],
					ISRC: String(updatedTrack.ISRC || ''),
					generate_isrc: Boolean(updatedTrack.generate_isrc || false),
					DA_ISRC: String(updatedTrack.DA_ISRC || ''),
					genre: updatedTrack.genre?.id || 0,
					subgenre: updatedTrack.subgenre?.id || 0,
					mix_name: String(updatedTrack.mix_name || ''),
					resource: String(updatedTrack.resource || ''),
					dolby_atmos_resource: String(updatedTrack.dolby_atmos_resource || ''),
					album_only: Boolean(updatedTrack.album_only || false),
					explicit_content: Boolean(updatedTrack.explicit_content || false),
					track_length: String(updatedTrack.track_length || '00:00:00'),
				};

				console.log('Track info a agregar:');

				// Verificar si el track ya existe en el array usando el nombre
				const trackExists = release.tracks.some(
					(track: any) => track.name === updatedTrack.name
				);

				if (!trackExists) {
					console.log(`Agregando track ${updatedTrack.name} al release`);

					// Usar $push con un objeto que cumpla exactamente con el esquema
					await Release.findByIdAndUpdate(
						trackData.release,
						{ $push: { tracks: trackInfo } },
						{ new: true }
					);
				} else {
					console.log(`Track ${updatedTrack.name} ya existe en el release`);
				}
			}
		}

		return NextResponse.json(
			{ success: true, data: updatedTrack },
			{ status: 200 }
		);
	} catch (error: any) {
		console.error('Error updating track:', error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'Internal Server Error',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
