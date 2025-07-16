// app/api/admin/updateSingle/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import { jwtVerify } from 'jose';
import Release from '@/models/ReleaseModel';
import { createLog } from '@/lib/logger';
import FormData from 'form-data';
import nodeFetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream, promises as fsPromises } from 'fs';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
		const spotify_token = req.cookies.get('stkn')?.value;
		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		// Verificar JWT
		let verifiedPayload;
		try {
			const { payload } = await jwtVerify(
				token,
				new TextEncoder().encode(process.env.JWT_SECRET)
			);
			verifiedPayload = payload;
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		await dbConnect();
		const trackId = params.id;
		let track_url = '';
		let track_path = '';
		let dolby_url = '';
		let dolby_path = '';
		let currentTrack: any = null;

		// Get the current track first
		if (trackId)
			currentTrack = await SingleTrack.findOne({ external_id: trackId });
		if (!currentTrack) {
			return NextResponse.json(
				{ success: false, error: 'Track not found' },
				{ status: 404 }
			);
		}

		const formData = await req.formData();
		const trackData = JSON.parse(formData.get('data') as string);
		const fileName = formData.get('fileName') as string;
		const chunk = formData.get('chunk') as Blob;
		const chunkIndex = parseInt(formData.get('chunkIndex') as string);
		const totalChunks = parseInt(formData.get('totalChunks') as string);
		const fileType = formData.get('fileType') as string;
		let tempFilePath: string | null = null;
		let tempDolbyFilePath: string | null = null;
		let tempDir: string | null = null;
		let safeFileName: string | null = null;

		if (!trackData) {
			return NextResponse.json(
				{ success: false, error: 'Faltan todos los datos del track' },
				{ status: 400 }
			);
		}
		if (trackData.newArtists && trackData.newArtists.length > 0) {
			const createdArtists = [];
			for (const newArtist of trackData.newArtists) {
				try {
					const createArtistReq = await fetch(
						`${req.nextUrl.origin}/api/admin/createArtistInRelease`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}; stkn=${spotify_token}`,
							},
							body: JSON.stringify({
								order: newArtist.order,
								kind: newArtist.kind,
								name: newArtist.name,
								email: newArtist.email,
								amazon_music_identifier: newArtist.amazon_music_identifier,
								apple_identifier: newArtist.apple_identifier,
								deezer_identifier: newArtist.deezer_identifier,
								spotify_identifier: newArtist.spotify_identifier,
							}),
						}
					);

					const createArtistRes = await createArtistReq.json();

					if (createArtistRes.success && createArtistRes.artist) {
						// Agregar el artista creado al array de artistas del release
						createdArtists.push(createArtistRes.artist);
					} else {
						console.error('Error al crear artista:', createArtistRes);
					}
				} catch (error) {
					console.error('Error en la creación de artista:', error);
				}
			}

			// Actualizar el array de artistas del release con los nuevos artistas creados
			if (createdArtists.length > 0) {
				trackData.artists = [...(trackData.artists || []), ...createdArtists];
			}
		}

		if (trackData.newContributors && trackData.newContributors.length > 0) {
			const createdUsers = [];
			for (const user of trackData.newContributors) {
				try {
					const createContributorReq = await fetch(
						`${req.nextUrl.origin}/api/admin/createContributorInMedia`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
							},
							body: JSON.stringify({
								email: user.email,
								name: user.name,
								order: user.order,
								role: user.role,
								role_name: user.role_name,
							}),
						}
					);

					const createContributorRes = await createContributorReq.json();

					if (
						createContributorRes.success &&
						createContributorRes.contributor
					) {
						// Agregar el artista creado al array de artistas del release
						createdUsers.push(createContributorRes.contributor);
					} else {
						console.error('Error al crear artista:', createContributorRes);
					}
				} catch (error) {
					console.error('Error en la creación de artista:', error);
				}
			}

			// Actualizar el array de contributors del release con los nuevos artistas creados
			if (createdUsers.length > 0) {
				trackData.contributors = [
					...(trackData.contributors || []),
					...createdUsers,
				];
			}
		}
		if (trackData.newPublishers && trackData.newPublishers.length > 0) {
			const createdUsers = [];
			for (const user of trackData.newPublishers) {
				try {
					const createUserReq = await fetch(
						`${req.nextUrl.origin}/api/admin/createPublisherinMedia`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
							},
							body: JSON.stringify({
								email: user.email,
								author: user.author,
								name: user.name,
								order: user.order,
								publisher: user.publisher,
							}),
						}
					);

					const createUserRes = await createUserReq.json();

					if (createUserRes.success && createUserRes.publisher) {
						// Agregar el artista creado al array de artistas del release
						createdUsers.push(createUserRes.publisher);
					} else {
						console.error('Error al crear artista:', createUserRes);
					}
				} catch (error) {
					console.error('Error en la creación de artista:', error);
				}
			}

			// Actualizar el array de publishers del release con los nuevos artistas creados
			if (createdUsers.length > 0) {
				trackData.publishers = [
					...(trackData.publishers || []),
					...createdUsers,
				];
			}
		}
		if (chunk && !isNaN(chunkIndex) && !isNaN(totalChunks)) {
			tempDir = path.join(process.cwd(), 'temp_uploads');
			await fs.mkdir(tempDir, { recursive: true });

			// Define el nombre del archivo temporal. ESTO DEBE ESTAR FUERA DEL IF.
			safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
			const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

			if (fileType === 'file') {
				const tempFileName = `upload_${trackId}_main_${safeFileName}.tmp`;
				tempFilePath = path.join(tempDir, tempFileName);
				await fs.appendFile(tempFilePath, chunkBuffer);
			} else if (fileType === 'dolby_file') {
				const tempFileName = `upload_${trackId}_dolby_${safeFileName}.tmp`;
				tempDolbyFilePath = path.join(tempDir, tempFileName);
				await fs.appendFile(tempDolbyFilePath, chunkBuffer);
			}

			if (chunkIndex < totalChunks - 1) {
				return NextResponse.json({
					success: true,
					message: `Chunk ${chunkIndex} recibido para ${fileType}`,
				});
			}

			// Validación de extensión para el archivo actual
			const extension = path.extname(fileName);
			if (extension.toLowerCase() !== '.wav') {
				if (fileType === 'file' && tempFilePath) await fs.unlink(tempFilePath);
				if (fileType === 'dolby_file' && tempDolbyFilePath)
					await fs.unlink(tempDolbyFilePath);
				return NextResponse.json(
					{
						success: false,
						error: `Formato de archivo no soportado para ${fileType}`,
					},
					{ status: 400 }
				);
			}
		}

		if (tempFilePath) {
			const formattedName = trackData.name.replaceAll(' ', '');

			const fixedFileName = formattedName + '.wav';
			const uploadTrackReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${fixedFileName}&filetype=audio/wav&upload_type=track.audio`,
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
			if (!uploadTrackReq.ok) {
				return NextResponse.json(
					{ success: false, error: 'Error al obtener la URL firmada' },
					{ status: 400 }
				);
			}
			const uploadTrackRes = await uploadTrackReq.json();
			// Extraer la URL y los campos del objeto firmado
			const { url: signedUrl, fields: trackFields } = uploadTrackRes.signed_url;
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

			const { size: fileSize } = await fs.stat(tempFilePath);
			const fileStream = createReadStream(tempFilePath);
			trackFormData.append('file', fileStream, {
				filename: fixedFileName,
				contentType: 'audio/wav',
				knownLength: fileSize,
			});
			const uploadResponse = await nodeFetch(signedUrl, {
				method: 'POST',
				body: trackFormData,
				headers: trackFormData.getHeaders(),
			});

			if (!uploadResponse.ok) {
				return NextResponse.json(
					{ success: false, error: 'Error al subir el archivo principal a S3' },
					{ status: 400 }
				);
			}
			await fs.unlink(tempFilePath);
			track_url = uploadResponse?.headers?.get('location') || '';

			if (track_url) {
				const trackDecoed = decodeURIComponent(
					new URL(track_url).pathname.slice(1)
				);
				track_path = trackDecoed.replace('media/', '');
			}
		}

		if (tempDolbyFilePath) {
			const formattedName = trackData.name.replaceAll(' ', '');

			const fixedFileName = formattedName + '_dolby' + '.wav';
			const uploadTrackReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${fixedFileName}&filetype=audio/wav&upload_type=track.audio`,
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
			if (!uploadTrackReq.ok) {
				return NextResponse.json(
					{ success: false, error: 'Error al obtener la URL firmada' },
					{ status: 400 }
				);
			}
			const uploadTrackRes = await uploadTrackReq.json();

			// Extraer la URL y los campos del objeto firmado
			const { url: signedUrl, fields: trackFields } = uploadTrackRes.signed_url;
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

			const { size: fileSize } = await fs.stat(tempDolbyFilePath);
			const fileStream = createReadStream(tempDolbyFilePath);
			trackFormData.append('file', fileStream, {
				filename: fixedFileName,
				contentType: 'audio/wav',
				knownLength: fileSize,
			});
			const uploadResponse = await nodeFetch(signedUrl, {
				method: 'POST',
				body: trackFormData,
				headers: trackFormData.getHeaders(),
			});
			if (!uploadResponse.ok) {
				return NextResponse.json(
					{
						success: false,
						error: 'Error al subir el archivo Dolby Atmos a S3',
					},
					{ status: 400 }
				);
			}
			await fs.unlink(tempDolbyFilePath);
			dolby_url = uploadResponse?.headers?.get('location') || '';
			if (dolby_url) {
				const dolbyDecoded = decodeURIComponent(
					new URL(dolby_url).pathname.slice(1)
				);
				dolby_path = dolbyDecoded.replace('media/', '');
			}
		}

		let currentTrackFormated = '';
		if (currentTrack.resource && currentTrack.resource.length > 0) {
			const currentTrackDecoded = decodeURIComponent(
				new URL(currentTrack.resource).pathname.slice(1)
			);
			currentTrackFormated = currentTrackDecoded.replace('media/', '');
		}
		let currentTrackDolbyFormated = '';
		if (
			currentTrack.dolby_atmos_resource &&
			currentTrack.dolby_atmos_resource.length > 0
		) {
			const currentTrackDolbyDecoded = decodeURIComponent(
				new URL(currentTrack.dolby_atmos_resource).pathname.slice(1)
			);
			currentTrackDolbyFormated = currentTrackDolbyDecoded.replace(
				'media/',
				''
			);
		}
		trackData.resource =
			track_url.length > 0 ? track_url : currentTrack.resource;
		trackData.dolby_atmos_resource =
			dolby_url.length > 0 ? dolby_url : currentTrack.dolby_atmos_resource;
		if (trackData.ISRC === null) delete trackData.ISRC;

		// Asegurar que publishers tenga la estructura correcta
		let publisherstoapi: any[] = [];
		// Asegurar que publishers tenga la estructura correcta
		if (Array.isArray(trackData.publishers)) {
			// Primero actualizar trackData.publishers con el order basado en el índice
			trackData.publishers = trackData.publishers.map(
				(pub: any, index: number) => {
					return { ...pub, order: index };
				}
			);

			// Luego crear publisherstoapi usando los datos ya procesados
			publisherstoapi = trackData.publishers.map((pub: any) => ({
				order: pub.order, // Ya tiene el order correcto de la línea anterior
				publisher: pub.publisher || 0,
				author: pub.author || '',
			}));
		} else {
			publisherstoapi = [];
		}

		// Asegurar que contributors tenga la estructura correcta
		let contributorsToApi: any[] = [];
		if (Array.isArray(trackData.contributors)) {
			// Procesar ambos arrays en una sola operación
			const processedContributors = trackData.contributors.map(
				(cont: any, index: number) => {
					return { ...cont, order: index };
				}
			);

			// Actualizar trackData.contributors
			trackData.contributors = processedContributors;

			// Crear contributorsToApi
			contributorsToApi = processedContributors.map((cont: any) => ({
				order: cont.order,
				contributor: cont.contributor || 0,
				role: cont.role || 0,
			}));
		} else {
			contributorsToApi = [];
		}
		// Asegurar que contributors tenga la estructura correcta
		let artistsToApi: any[] = [];
		if (Array.isArray(trackData.artists)) {
			// Procesar ambos arrays en una sola operación
			const processedArtists = trackData.artists.map(
				(art: any, index: number) => {
					return { ...art, order: index };
				}
			);

			// Actualizar trackData.artists
			trackData.artists = processedArtists;

			// Crear artistsToApi
			artistsToApi = processedArtists.map((art: any) => ({
				order: art.order,
				artist: art.artist || 0,
				kind: art.kind || '',
			}));
		} else {
			artistsToApi = [];
		}
		delete trackData.newContributors;
		delete trackData.newArtists;
		delete trackData.newPublishers;
		if (trackData.isImported) {
			delete trackData.isImported;
		}
		if (trackData.id) {
			delete trackData.id;
		}
		const dataToApi = {
			...trackData,
			resource: tempFilePath ? track_path : currentTrackFormated,
			dolby_atmos_resource: tempDolbyFilePath
				? dolby_path
				: currentTrackDolbyFormated,
			publishers: publisherstoapi,
			artists: artistsToApi,
			contributors: contributorsToApi,
		};
		delete dataToApi.qc_feedback;
		delete dataToApi.file;
		delete dataToApi.genre_name;
		delete dataToApi.subgenre_name;

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
					contributor: Number(contributor.contributor) || 0,
					name: String(contributor.name) || '',
					role: Number(contributor.role) || 0,
					role_name: contributor.role_name || '',
					order: Number(contributor.order) || 0,
				})
			);
		}
		if (trackData.publishers) {
			trackData.publishers = trackData.publishers.map((publisher: any) => ({
				publisher: Number(publisher.publisher) || 0,
				author: String(publisher.author) || '',
				order: Number(publisher.order) || 0,
				name: String(publisher.name) || '',
			}));
		}
		trackData.resource =
			track_url.length > 0 ? track_url : currentTrack.resource;
		trackData.dolby_atmos_resource =
			dolby_url.length > 0 ? dolby_url : currentTrack.dolby_atmos_resource;

		const dataToRelease = {
			title: trackData.name,
			mixName: trackData.mix_name,
			external_id: trackData.external_id,
			resource: track_url.length > 0 ? track_url : currentTrack.resource,
			available: trackData.available,
		};
		if (trackData.release === currentTrack.release) {
			const updatedRelease = await Release.findOneAndUpdate(
				{
					external_id: trackData.release,
					'tracks.external_id': trackData.external_id,
				},
				{
					$set: {
						'tracks.$': dataToRelease,
					},
				},
				{ new: true }
			);

			if (!updatedRelease) {
				return NextResponse.json(
					{
						success: false,
						error: `No se pudo actualizar en la base de datos: data: ${trackData.release}, current: ${currentTrack.release}`,
					},
					{ status: 404 }
				);
			}
			//si el track pertenece al mismo release
			const formattedRelease = updatedRelease.toObject();
			for (let i = 0; i < formattedRelease.tracks.length; i++) {
				const track = formattedRelease.tracks[i];
				formattedRelease.tracks[i] = { ...track, order: i };
				if (track.external_id === trackData.external_id) {
					dataToApi.order = i;
					const trackToApi = await fetch(
						`${process.env.MOVEMUSIC_API}/tracks/${trackData.external_id}`,
						{
							method: 'PUT',
							body: JSON.stringify(dataToApi),
							headers: {
								'Content-Type': 'application/json',
								Authorization: `JWT ${moveMusicAccessToken}`,
								'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
								Referer: process.env.MOVEMUSIC_REFERER || '',
							},
						}
					);
					await SingleTrack.findOneAndUpdate(
						{ external_id: trackId },
						trackData,
						{
							new: true,
						}
					);
					continue;
				}
				await formatAndUpdateTrack(track, i, moveMusicAccessToken);
			}

			try {
				const logData = {
					action: 'UPDATE' as const,
					entity: 'TRACK' as const,
					entityId: trackData.external_id,
					details: `Track actualizado en el release ${trackData.release}`,
					userId: verifiedPayload.id as string,
					userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
					userRole: verifiedPayload.role as string,

					ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
				};
				await createLog(logData);
			} catch (logError) {
				console.error('Error al crear el log:', logError);
				// No interrumpimos el flujo si falla el log
			}
		} else {
			// elimina el track al nuevo release
			let updatedRelease = await Release.findOneAndUpdate(
				{
					external_id: currentTrack.release,
				},
				{
					$pull: {
						tracks: { external_id: currentTrack.external_id },
					},
				},
				{ new: true }
			);
			updatedRelease = updatedRelease.toObject();
			for (let i = 0; i < updatedRelease.tracks.length; i++) {
				const track = updatedRelease.tracks[i];
				await formatAndUpdateTrack(track, i, moveMusicAccessToken);
			}

			if (!updatedRelease) {
				return NextResponse.json(
					{
						success: false,
						error: 'No se encontró el release para agregar el track',
					},
					{ status: 404 }
				);
			}
			let deleteTrackFromRelease = await Release.findOneAndUpdate(
				{
					external_id: trackData.release,
				},
				{
					$push: {
						tracks: dataToRelease,
					},
				},
				{ new: true }
			);
			deleteTrackFromRelease = deleteTrackFromRelease.toObject();
			if (deleteTrackFromRelease.tracks.length > 0) {
				for (let i = 0; i < deleteTrackFromRelease.tracks.length; i++) {
					const track = deleteTrackFromRelease.tracks[i];
					if (track.external_id === trackData.external_id) {
						dataToApi.order = i;
						const trackToApi = await fetch(
							`${process.env.MOVEMUSIC_API}/tracks/${trackData.external_id}`,
							{
								method: 'PUT',
								body: JSON.stringify(dataToApi),
								headers: {
									'Content-Type': 'application/json',
									Authorization: `JWT ${moveMusicAccessToken}`,
									'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
									Referer: process.env.MOVEMUSIC_REFERER || '',
								},
							}
						);
						await SingleTrack.findOneAndUpdate(
							{ external_id: trackId },
							trackData,
							{
								new: true,
							}
						);
					}
					await formatAndUpdateTrack(track, i, moveMusicAccessToken);
				}
			}
		}

		return NextResponse.json({
			success: true,
			track: {
				title: trackData.name,
				mixName: trackData.mix_name,
				external_id: trackData.external_id,
				resource: trackData.resource,
				available: trackData.available,
			},
			message: 'Track actualizado correctamente',
		});
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
async function formatAndUpdateTrack(
	track: any,
	order: number,
	moveMusicAccessToken: string | undefined
) {
	if (!moveMusicAccessToken) {
		throw new Error('Token de acceso no disponible');
	}
	const trackToApi = await fetch(
		`${process.env.MOVEMUSIC_API}/tracks/${track.external_id}`,
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
	if (!trackToApi.ok) {
		throw new Error('Error al obtener el track');
	}
	const trackToApiRes = await trackToApi.json();
	let newResource = '';
	if (trackToApiRes.resource && trackToApiRes.resource.length > 0) {
		const formattedReource = decodeURIComponent(
			new URL(trackToApiRes.resource).pathname.slice(1)
		);
		newResource = formattedReource.replace('media/', '');
	}
	let newDolbyResource = '';
	if (
		trackToApiRes.dolby_atmos_resource &&
		trackToApiRes.dolby_atmos_resource.length > 0
	) {
		const formattedDolbyResource = decodeURIComponent(
			new URL(trackToApiRes.dolby_atmos_resource).pathname.slice(1)
		);
		newDolbyResource = formattedDolbyResource.replace('media/', '');
	}
	const formattedArtists = trackToApiRes.artists.map((artist: any) => ({
		artist: artist.artist.id,
		kind: artist.kind,
		order: artist.order,
	}));
	const formattedContributors = trackToApiRes.contributors.map(
		(contributor: any) => ({
			contributor: contributor.contributor.id,
			role: contributor.role.id,
			order: contributor.order,
		})
	);
	const formattedPublishers = trackToApiRes.publishers.map(
		(publisher: any) => ({
			publisher: publisher.publisher.id,
			order: publisher.order,
			author: publisher.author,
		})
	);
	const formattedTrackToApi = {
		...trackToApiRes,
		order: order,
		artists: formattedArtists,
		resource: newResource || '',
		dolby_atmos_resource: newDolbyResource || '',
		contributors: formattedContributors,
		publishers: formattedPublishers,
	};
	delete formattedTrackToApi.qc_feedback;
	delete formattedTrackToApi.qc_passed;
	delete formattedTrackToApi.track_data_complete;
	const updateTrackReq = await fetch(
		`${process.env.MOVEMUSIC_API}/tracks/${track.external_id}`,
		{
			method: 'PUT',
			body: JSON.stringify(formattedTrackToApi),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `JWT ${moveMusicAccessToken}`,
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
			},
		}
	);
	if (!updateTrackReq.ok) {
		throw new Error('Error al actualizar el track');
	}
	await SingleTrack.findOneAndUpdate(
		{ external_id: track.external_id },
		{ $set: { order: order } },
		{ new: true }
	);
	return true;
}
