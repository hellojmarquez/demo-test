// app/api/admin/updateRelease/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import Release from '@/models/ReleaseModel';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
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

		const release = await Release.findOne({ external_id: params.id });
		if (!release) {
			return NextResponse.json(
				{ success: false, message: 'No se encontró el release' },
				{ status: 404 }
			);
		}
		const formData = await req.formData();
		const data = formData.get('data');
		const picture = formData.get('picture');

		if (!data) {
			return NextResponse.json(
				{ success: false, message: 'No se proporcionaron datos' },
				{ status: 400 }
			);
		}

		const releaseData = JSON.parse(data as string);

		// Procesar los nuevos artistas de release
		if (releaseData.newArtists && releaseData.newArtists.length > 0) {
			for (const artist of releaseData.newArtists) {
				try {
					const artistResponse = await fetch(
						`${req.nextUrl.origin}/api/admin/createArtistInRelease`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
							},
							body: JSON.stringify({
								name: artist.name,
								email: artist.email,
								amazon_music_identifier: artist.amazon_music_identifier,
								apple_identifier: artist.apple_identifier,
								deezer_identifier: artist.deezer_identifier,
								spotify_identifier: artist.spotify_identifier,
							}),
						}
					);

					const artistResult = await artistResponse.json();

					releaseData.artists.push(artistResult.artist);
				} catch (error) {
					console.error('Error al procesar artista:', error);
				}
			}
		}
		const fullNewTrackToApi = [];
		const fullNewTrackToBBDD = [];
		const releaseTrackMetadata = [];
		// Procesar los nuevos tracks
		if (releaseData.newTracks && releaseData.newTracks.length > 0) {
			for (const track of releaseData.newTracks) {
				console.log('-------NUEVO TRACK RECIBIDO---------');
				// Buscar el archivo en el FormData usando el nombre del recurso
				const trackFile = formData.get(`track_${track.resource}`);
				console.log('TRACK FILE', track);
				const trackData = {
					name: track.title,
					mix_name: track.mixName || '',
					language: track.language || 'ES',
					vocals: track.vocals || 'ZXX',
					artists: track.artists || [],
					publishers: track.publishers || [],
					contributors: track.contributors || [],
					label_share: track.label_share || '',
					genre: track.genre || 0,
					genre_name: track.genre_name || '',
					subgenre: track.subgenre || 0,
					subgenre_name: track.subgenre_name || '',
					dolby_atmos_resource: track.dolby_atmos_resource || '',
					copyright_holder: track.copyright_holder || '',
					copyright_holder_year: track.copyright_holder_year || '',
					album_only: track.album_only || false,
					sample_start: track.sample_start || '',
					explicit_content: track.explicit_content || false,
					ISRC: track.ISRC || '',
					generate_isrc: track.generate_isrc || false,
					DA_ISRC: track.DA_ISRC || '',
					track_lenght: track.track_length || '',
				};
				const trackFormData = new FormData();
				trackFormData.append('data', JSON.stringify(trackData));
				if (trackFile) {
					trackFormData.append('file', trackFile);
				} else {
					console.log('No se encontró archivo para track:', track.title);
				}
				const response = await fetch(
					`${req.nextUrl.origin}/api/admin/createSingle`,
					{
						method: 'POST',
						headers: {
							Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
						},
						body: trackFormData,
					}
				);
				const data = await response.json();
				if (!data.success) {
					throw new Error(data.message || 'Error al crear el track');
				}

				// Agregar el track creado al release
				if (data.track) {
					releaseTrackMetadata.push({
						title: data.track.name,
						external_id: data.track.external_id,
						mixName: data.track.mix_name,
						resource: data.track.resource,
					});
					const source_path = decodeURIComponent(
						new URL(data.track.resource).pathname.slice(1)
					);

					data.track.resource = source_path;

					data.track.id = data.track.extrernal_id;
					delete data.track.external_id;
					fullNewTrackToApi.push(data.track);
					delete data.track.id;
					fullNewTrackToBBDD.push(data.track);
				}
			}
		}

		// Procesar los edited tracks
		if (releaseData.editedTracks && releaseData.editedTracks.length > 0) {
			for (const track of releaseData.editedTracks) {
				console.log('TRACK TO EDIT', track);
				try {
					const trackFormData = new FormData();

					// Buscar el archivo en el FormData usando el external_id
					const trackFile = formData.get(`edited_track_${track.external_id}`);

					// Procesar newArtists si existen
					let processedArtists = [];
					if (track.newArtists && track.newArtists.length > 0) {
						for (const newArtist of track.newArtists) {
							try {
								// Crear el nuevo artista
								const artistResponse = await fetch(
									`${req.nextUrl.origin}/api/admin/createArtistInRelease`,
									{
										method: 'POST',
										headers: {
											'Content-Type': 'application/json',
											Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
										},
										body: JSON.stringify({
											name: newArtist.name,
											email: newArtist.email,
											kind: newArtist.kind,
											amazon_music_identifier:
												newArtist.amazon_music_identifier || '',
											apple_identifier: newArtist.apple_identifier || '',
											deezer_identifier: newArtist.deezer_identifier || '',
											spotify_identifier: newArtist.spotify_identifier || '',
										}),
									}
								);

								const artistResult = await artistResponse.json();

								if (artistResult.success) {
									// Agregar el artista procesado a la lista de artistas
									processedArtists.push(artistResult.artist);
								}
							} catch (error) {
								console.error('Error al procesar nuevo artista:', error);
							}
						}
					}

					const trackData = {
						order: (releaseData.tracks?.length || 0) + 1,
						name: track.title,
						mix_name: track.mixName || '',
						language: track.language || 'ES',
						vocals: track.vocals || 'ZXX',
						artists: processedArtists, // Usar los artistas procesados
						publishers: track.publishers || [],
						contributors: track.contributors || [],
						label_share: track.label_share || '',
						genre: track.genre || 0,
						genre_name: track.genre_name || '',
						subgenre: track.subgenre || 0,
						subgenre_name: track.subgenre_name || '',
						dolby_atmos_resource: track.dolby_atmos_resource || '',
						copyright_holder: track.copyright_holder || '',
						copyright_holder_year: track.copyright_holder_year || '',
						album_only: track.album_only || false,
						sample_start: track.sample_start || '',
						explicit_content: track.explicit_content || false,
						ISRC: track.ISRC || '',
						generate_isrc: track.generate_isrc || true,
						DA_ISRC: track.DA_ISRC || '',
						track_lenght: track.track_lenght || '',
						external_id: track.external_id || 0,
					};

					trackFormData.append('data', JSON.stringify(trackData));
					if (trackFile) {
						trackFormData.append('file', trackFile);
					}

					const trackResponse = await fetch(
						`${req.nextUrl.origin}/api/admin/updateSingle/${track.external_id}`,
						{
							method: 'PUT',
							headers: {
								Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
							},
							body: trackFormData,
						}
					);

					// Log de la respuesta para debug
					const data = await trackResponse.json();
					if (!data.success) {
						throw new Error(data.message || 'Error al crear el track');
					}
					if (data.track) {
						releaseTrackMetadata.push({
							title: data.track.name,
							external_id: data.track.external_id,
							mixName: data.track.mix_name,
							resource: data.track.resource,
						});
						const source_path = decodeURIComponent(
							new URL(data.track.resource).pathname.slice(1)
						);

						data.track.resource = source_path;

						data.track.id = data.track.extrernal_id;
						fullNewTrackToApi.push(data.track);
						delete data.track.id;
						fullNewTrackToBBDD.push(data.track);
					}
				} catch (error) {
					console.error('Error al procesar track:', error);
				}
			}
		}
		let picture_url = '';
		let picture_path = '';
		// Verificar si picture es una nueva imagen o un link existente
		if (picture) {
			if (picture instanceof File) {
				// Es una nueva imagen

				// Aquí puedes procesar la nueva imagen
				// Por ejemplo, subirla a S3 y obtener la nueva URL
				const uploadArtworkReq = await fetch(
					`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${picture.name}&filetype=${picture.type}&upload_type=release.artwork`,
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
				const uploadArtworkRes = await uploadArtworkReq.json();
				const { url: signedUrl, fields: resFields } =
					uploadArtworkRes.signed_url;

				const pictureFormData = new FormData();
				Object.entries(resFields).forEach(([key, value]) => {
					if (typeof value === 'string' || value instanceof Blob) {
						pictureFormData.append(key, value);
					}
				});

				pictureFormData.append('file', picture);
				const uploadResponse = await fetch(signedUrl, {
					method: 'POST',
					body: pictureFormData,
				});

				picture_url = uploadResponse?.headers?.get('location') || '';
				picture_path = decodeURIComponent(
					new URL(picture_url).pathname.slice(1)
				);
			} else if (typeof picture === 'string') {
				// Si es una URL existente, decodificar la ruta
				try {
					releaseData.artwork = decodeURIComponent(
						new URL(picture).pathname.slice(1)
					);
				} catch (error) {
					console.error('Error decoding picture URL:', error);
					releaseData.artwork = picture; // Usar el valor original si hay error
				}
			}
		}

		// Convertir los valores a números
		if (releaseData.label) releaseData.label = Number(releaseData.label);
		if (releaseData.publisher)
			releaseData.publisher = Number(releaseData.publisher);
		if (releaseData.genre) releaseData.genre = Number(releaseData.genre);
		if (releaseData.subgenre)
			releaseData.subgenre = Number(releaseData.subgenre);

		// Manejar la imagen del release
		if (picture instanceof File) {
			// Si es un archivo nuevo, usar picture_path
			releaseData.artwork = picture_path;
			releaseData.picture = picture_url;
		} else if (typeof picture === 'string' && picture.startsWith('https://')) {
			// Si es una URL de S3, extraer solo la ruta del path
			releaseData.picture = picture;
			const url = new URL(picture);
			releaseData.artwork = decodeURIComponent(url.pathname.slice(1));
		} else if (releaseData.picture) {
			// Si hay una URL en releaseData.picture, usarla
			const url = new URL(releaseData.picture);
			releaseData.artwork = decodeURIComponent(url.pathname.slice(1));
		}

		// Mantener los tracks existentes y agregar los nuevos

		releaseData.tracks = [...(releaseData.tracks || []), ...fullNewTrackToBBDD];

		// Primero buscar el release por external_id

		// Preparar los datos para la base de datos
		const dbReleaseData = {
			...releaseData,

			tracks: [...(release.tracks || []), ...releaseTrackMetadata],
		};

		delete dbReleaseData._id;
		delete dbReleaseData.editedTracks;
		delete dbReleaseData.newTracks;
		delete dbReleaseData.newArtists;

		// Actualiza   r la base de datos con la estructura simplificada
		const updatedRelease = await Release.findOneAndUpdate(
			{ external_id: params.id },
			{ $set: dbReleaseData },
			{ new: true, runValidators: true }
		);

		// if (!updatedRelease) {
		// 	return NextResponse.json(
		// 		{ success: false, message: 'Error al actualizar el release' },
		// 		{ status: 500 }
		// 	);
		// }
		await Promise.all(
			release.tracks.map(async (track: any) => {
				let foundTrack = await SingleTrack.findOne({
					external_id: track.external_id,
				});
				if (foundTrack) {
					foundTrack = foundTrack.toObject();
					// Modificar el resource usando URL
					if (foundTrack.resource) {
						const url = new URL(foundTrack.resource);
						foundTrack.resource = url.pathname;
					}
					foundTrack.release = release.external_id;
					delete foundTrack._id;
					delete foundTrack.__v;
					delete foundTrack.createdAt;
					delete foundTrack.updatedAt;
					fullNewTrackToApi.push(foundTrack);
				}
			})
		);
		const dataToApi = {
			...releaseData,
			tracks: fullNewTrackToApi,
		};
		delete dataToApi.newTracks;
		delete dataToApi.editedTracks;
		delete dataToApi.newArtists;
		delete dataToApi._id;
		delete dataToApi.__v;
		delete dataToApi.external_id;
		delete dataToApi.genre_name;
		delete dataToApi.subgenre_name;
		delete dataToApi.picture;
		delete dataToApi.createdAt;
		delete dataToApi.updatedAt;
		dataToApi.artists.forEach((artist: any) => {
			delete artist.name;
		});
		dataToApi.tracks = [];
		// dataToApi.tracks.forEach((track: any) => {
		// 	delete track.external_id;
		// 	delete track.status;
		// 	delete track.genre_name;
		// 	delete track.subgenre_name;
		// });

		// Llamar a la API externa con la estructura completa
		try {
			const externalApiRes = await fetch(
				`${process.env.MOVEMUSIC_API}/releases/${params.id}`,
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

			if (!externalApiRes.ok) {
				const errorText = await externalApiRes.text();
				console.error('API Error Response:', {
					status: externalApiRes.status,
					statusText: externalApiRes.statusText,
					body: errorText,
				});
				throw new Error(
					`API responded with status ${externalApiRes.status}: ${errorText}`
				);
			}

			const externalApiResJson = await externalApiRes.json();

			return NextResponse.json({
				success: true,
				message: 'Release actualizado exitosamente',
			});
		} catch (apiError: any) {
			console.error('Error en llamada a API externa:', apiError);
			return NextResponse.json(
				{
					success: false,
					message: `Error en API externa: ${apiError.message}`,
				},
				{ status: 500 }
			);
		}
	} catch (error: any) {
		console.error('Error al actualizar el:', error);
		return NextResponse.json(
			{
				success: false,
				message: error.message || 'Error al actualizar ',
			},
			{ status: 500 }
		);
	}
}
