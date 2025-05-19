// app/api/admin/updateRelease/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import Release from '@/models/ReleaseModel';
import dbConnect from '@/lib/mongodb';
import SingleTrack from '@/models/SingleTrack';
import { jwtVerify } from 'jose';

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

		// Procesar los nuevos tracks
		if (releaseData.newTracks && releaseData.newTracks.length > 0) {
			for (const track of releaseData.newTracks) {
				console.log('Procesando track:', track);

				// Buscar el archivo en el FormData usando el nombre del recurso
				const trackFile = formData.get(`track_${track.resource}`);
				if (trackFile) {
					console.log('Archivo encontrado para track:', track.title);
					const trackFormData = new FormData();

					// Preparar los datos del track para la API
					const trackData = {
						name: track.title,
						mix_name: track.mixName || '',
						language: track.language || 'ES',
						vocals: track.vocals || 'ZXX',
						artists: track.artists || [],
						publishers: releaseData.publishers || [],
						contributors: releaseData.contributors || [],
						label_share: track.label_share || '',
						genre: track.genre || 3,
						genre_name: track.genre_name || 'Alternative',
						subgenre: track.subgenre || 90,
						subgenre_name: track.subgenre_name || 'Alternative',
						dolby_atmos_resource: track.dolby_atmos_resource || '',
						copyright_holder: track.copyright_holder || 'ISLA sOUNDS',
						copyright_holder_year: track.copyright_holder_year || '2025',
						album_only: track.album_only || true,
						sample_start: track.sample_start || '',
						explicit_content: track.explicit_content || true,
						ISRC: track.ISRC || '',
						generate_isrc: true,
						DA_ISRC: track.DA_ISRC || '',
						track_lenght: track.track_length || '',
					};

					trackFormData.append('file', trackFile);
					trackFormData.append('data', JSON.stringify(trackData));

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
						releaseData.tracks.push(data.track);
					}
				} else {
					console.log('No se encontró archivo para track:', track.title);
				}
			}
		}

		// Procesar los edited tracks
		if (releaseData.editedTracks && releaseData.editedTracks.length > 0) {
			for (const track of releaseData.editedTracks) {
				try {
					const trackFormData = new FormData();

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
						publishers: releaseData.publishers || [],
						contributors: releaseData.contributors || [],
						label_share: track.label_share || '',
						genre: track.genre || 3,
						genre_name: track.genre_name || 'Alternative',
						subgenre: track.subgenre || 90,
						subgenre_name: track.subgenre_name || 'Alternative',
						dolby_atmos_resource: track.dolby_atmos_resource || '',
						copyright_holder: track.copyright_holder || 'ISLA sOUNDS',
						copyright_holder_year: track.copyright_holder_year || '2025',
						album_only: track.album_only || true,
						sample_start: track.sample_start || '',
						explicit_content: track.explicit_content || true,
						ISRC: track.ISRC || '',
						generate_isrc: true,
						DA_ISRC: track.DA_ISRC || '',
						track_lenght: track.track_lenght || '',
					};

					trackFormData.append('data', JSON.stringify(trackData));
					trackFormData.append('file', track.file);

					const trackResponse = await fetch(
						`${req.nextUrl.origin}/api/admin/updateSingle/`,
						{
							method: 'POST',
							headers: {
								Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
							},
							body: trackFormData,
						}
					);

					const trackResult = await trackResponse.json();

					if (trackResult.success) {
						console.log('Track creado exitosamente, agregando al release...');
						releaseData.tracks.push(trackResult.track);
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

		// Primero buscar el release por external_id
		const release = await Release.findOne({ external_id: params.id });
		if (!release) {
			return NextResponse.json(
				{ success: false, message: 'No se encontró el release' },
				{ status: 404 }
			);
		}

		// Llamar a la API externa
		const apiRes = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/${params.id}`,
			{
				method: 'PUT',
				body: JSON.stringify(releaseData),
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);
		const apiResJson = await apiRes.json();
		console.log('apiResJson', apiResJson);

		// Luego usar el _id de MongoDB para la actualización
		const updatedRelease = await Release.findByIdAndUpdate(
			release._id, // Usar el _id de MongoDB
			{ $set: releaseData },
			{ new: true, runValidators: true }
		);

		if (!updatedRelease) {
			return NextResponse.json(
				{ success: false, message: 'No se encontró el release' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: 'Release actualizado exitosamente',
			// data: updatedRelease,
		});
	} catch (error: any) {
		console.error('Error al actualizar el release:', error);
		return NextResponse.json(
			{
				success: false,
				message: error.message || 'Error al actualizar el release',
			},
			{ status: 500 }
		);
	}
}
