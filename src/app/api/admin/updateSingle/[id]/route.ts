// app/api/admin/updateSingle/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import Release from '@/models/ReleaseModel';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		console.log('update track');
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT
		try {
			const { payload: verifiedPayload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}
		await dbConnect();
		const trackId = params.id;

		// Get the current track first
		const currentTrack = await SingleTrack.findById(trackId);
		if (!currentTrack) {
			return NextResponse.json(
				{ success: false, error: 'Track not found' },
				{ status: 404 }
			);
		}

		const contentType = req.headers.get('content-type') || '';
		let trackData: Record<string, any> = {};

		if (contentType.includes('multipart/form-data')) {
			const formData = await req.formData();
			const file = formData.get('file') as File | null;
			let data = formData.get('data') as string | null;

			if (data) {
				trackData = JSON.parse(data);

				// Asegurarse de que los artistas tengan el formato correcto
				if (trackData.artists) {
					trackData.artists = trackData.artists.map((artist: any) => ({
						artist: Number(artist.artist) || 0,
						kind: String(artist.kind || 'main'),
						order: Number(artist.order || 0),
						name: String(artist.name || ''),
					}));
				}

				// Asegurarse de que los contribuidores tengan el formato correcto
				if (trackData.contributors) {
					trackData.contributors = trackData.contributors.map(
						(contributor: any) => ({
							external_id: Number(contributor.external_id) || 0,
							name: String(contributor.name || ''),
							role: Number(contributor.role) || 0,
							order: Number(contributor.order) || 0,
						})
					);
				}

				if (file) {
					console.log('ACTUALIZANDO TRAck');
					const uploadTrackReq = await fetch(
						`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${file.name}&filetype=${file.type}&upload_type=track.audio`,
						{
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `JWT ${moveMusicAccessToken}`,
								'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
								Referer: process.env.MOVEMUSIC_REFERER || '',
							},
						}
					);
					const uploadTrackRes = await uploadTrackReq.json();

					// Extraer la URL y los campos del objeto firmado
					const { url: signedUrl, fields: trackFields } =
						uploadTrackRes.signed_url;
					// Crear un objeto FormData y agregar los campos y el archivo
					const trackFormData = new FormData();
					Object.entries(trackFields).forEach(([key, value]) => {
						if (typeof value === 'string' || value instanceof Blob) {
							trackFormData.append(key, value);
						} else {
							console.warn(
								`El valor de '${key}' no es un tipo válido para FormData:`,
								value
							);
						}
					});

					trackFormData.append('file', file);

					// Realizar la solicitud POST a la URL firmada
					const uploadResponse = await fetch(signedUrl, {
						method: 'POST',
						body: trackFormData,
					});

					trackData.resource = uploadResponse?.headers?.get('location');

					if (!uploadResponse.ok) {
						console.error(
							'Error al subir el archivo de audio a S3:',
							await uploadResponse.text()
						);
						return NextResponse.json(
							{
								success: false,
								error: 'Error al subir el archivo de audio a S3',
							},
							{ status: 500 }
						);
					}
				}
			}
		} else if (contentType.includes('application/json')) {
			trackData = await req.json();

			// Asegurarse de que los artistas tengan el formato correcto
			if (trackData.artists) {
				trackData.artists = trackData.artists.map((artist: any) => ({
					artist: Number(artist.artist) || 0,
					kind: String(artist.kind || 'main'),
					order: Number(artist.order || 0),
					name: String(artist.name || ''),
				}));
			}

			// Asegurarse de que los contribuidores tengan el formato correcto
			if (trackData.contributors) {
				trackData.contributors = trackData.contributors.map(
					(contributor: any) => ({
						external_id: Number(contributor.external_id) || 0,
						name: String(contributor.name || ''),
						role: Number(contributor.role) || 0,
						order: Number(contributor.order) || 0,
					})
				);
			}
		} else {
			return NextResponse.json(
				{ success: false, error: 'Invalid content type' },
				{ status: 400 }
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
								name: String(artist.name || ''),
						  }))
						: [],
					ISRC: String(updatedTrack.ISRC || ''),
					generate_isrc: Boolean(updatedTrack.generate_isrc || false),
					DA_ISRC: String(updatedTrack.DA_ISRC || ''),
					genre: updatedTrack.genre?.id || 0,
					genre_name: updatedTrack.genre?.name || '',
					subgenre: updatedTrack.subgenre?.id || 0,
					subgenre_name: updatedTrack.subgenre?.name || '',
					mix_name: String(updatedTrack.mix_name || ''),
					resource: String(updatedTrack.resource || ''),
					dolby_atmos_resource: String(updatedTrack.dolby_atmos_resource || ''),
					album_only: Boolean(updatedTrack.album_only || false),
					explicit_content: Boolean(updatedTrack.explicit_content || false),
					track_length: String(updatedTrack.track_length || '00:00:00'),
				};

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

		return NextResponse.json({ success: true, data: updatedTrack });
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
