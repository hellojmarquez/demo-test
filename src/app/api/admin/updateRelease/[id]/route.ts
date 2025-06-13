// app/api/admin/updateRelease/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import Release from '@/models/ReleaseModel';
import dbConnect from '@/lib/dbConnect';
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
		let picture_url = '';
		let picture_path = '';
		if (!data) {
			return NextResponse.json(
				{ success: false, message: 'No se proporcionaron datos' },
				{ status: 400 }
			);
		}
		if (picture instanceof File) {
			const uploadArtworkReq = await fetch(
				`${
					process.env.MOVEMUSIC_API
				}/obtain-signed-url-for-upload/?filename=${picture.name.replaceAll(
					' ',
					''
				)}&filetype=${picture.type}&upload_type=release.artwork`,
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

			// Extraer la URL y los campos del objeto firmado
			const { url: signedUrl, fields: resFields } = uploadArtworkRes.signed_url;
			// Crear un objeto FormData y agregar los campos y el archivo
			const pictureFormData = new FormData();
			Object.entries(resFields).forEach(([key, value]) => {
				if (typeof value === 'string' || value instanceof Blob) {
					pictureFormData.append(key, value);
				} else {
					console.warn(
						`El valor de '${key}' no es un tipo válido para FormData:`,
						value
					);
				}
			});

			pictureFormData.append('file', picture);

			// Realizar la solicitud POST a la URL firmada
			const uploadResponse = await fetch(signedUrl, {
				method: 'POST',
				body: pictureFormData,
			});

			picture_url = uploadResponse?.headers?.get('location') || '';
			const picture_path_decoded = decodeURIComponent(
				new URL(picture_url).pathname.slice(1)
			);
			picture_path = picture_path_decoded.replace('media/', '');

			if (!uploadResponse.ok) {
				return NextResponse.json(
					{
						success: false,
						error:
							uploadResponse.statusText ||
							'Error al subir el archivo de audio a S3',
					},
					{ status: uploadResponse.status || 400 }
				);
			}
		}
		const releaseData = JSON.parse(data as string);
		if (!releaseData.ean || releaseData.ean.length === 0) {
			delete releaseData.ean;
		}
		if (releaseData.territory === 'worldwide') {
			releaseData.countries = [];
		}

		// Convertir los valores a números
		if (releaseData.label) releaseData.label = Number(releaseData.label);
		if (releaseData.publisher)
			releaseData.publisher = Number(releaseData.publisher);
		if (releaseData.genre) releaseData.genre = Number(releaseData.genre);
		if (releaseData.subgenre)
			releaseData.subgenre = Number(releaseData.subgenre);

		// Manejar nuevos artistas si existen
		if (releaseData.newArtists && releaseData.newArtists.length > 0) {
			const createdArtists = [];
			for (const newArtist of releaseData.newArtists) {
				try {
					const createArtistReq = await fetch(
						`${req.nextUrl.origin}/api/admin/createArtistInRelease`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
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
				releaseData.artists = [
					...(releaseData.artists || []),
					...createdArtists,
				];
			}
		}
		const artistToApi = {
			artists: releaseData.artists.map(
				(artist: { name: string; [key: string]: any }) => {
					const { name, ...rest } = artist;
					return rest;
				}
			),
		};
		const getRelease = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/${releaseData.external_id}`,
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
		const getReleaseRes = await getRelease.json();
		getReleaseRes.tracks.forEach((track: any) => {
			if (track.resource) {
				const decoded = decodeURIComponent(
					new URL(track.resource).pathname.slice(1)
				);
				track.resource = decoded.replace('media/', '');
			}
			if (track.dolby_atmos_resource && track.dolby_atmos_resource.length > 0) {
				releaseData.dolby_atmos = true;
			}
		});
		const releaseToApiData = {
			...releaseData,
			artists: artistToApi.artists,
			tracks: getReleaseRes.tracks,
			artwork:
				picture_path.length > 0
					? picture_path
					: decodeURIComponent(
							new URL(release.picture.full_size).pathname.slice(1)
					  ).replace('media/', ''),
		};

		const releaseToApi = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/${release.external_id}`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify(releaseToApiData),
			}
		);

		const apiRes = await releaseToApi.json();

		if (!apiRes.id) {
			return NextResponse.json(
				{
					success: false,
					error: apiRes || 'Error al crear el release',
				},
				{ status: 400 }
			);
		}

		const cleanUrl = (url: string): string => {
			return url.split('?')[0];
		};
		const getUpdatedRelease = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/${releaseData.external_id}`,
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
		const getUpdatedReleaseRes = await getUpdatedRelease.json();
		const dataToUpdate = {
			...releaseData,
			label: releaseData.label,
			artists: releaseData.artists,
			acr_alert: getUpdatedReleaseRes.acr_alert,
			has_acr_alert: getUpdatedReleaseRes.has_acr_alert,
			release_user_declaration: getUpdatedReleaseRes.release_user_declaration,
			picture: {
				full_size: getUpdatedReleaseRes.artwork?.full_size
					? cleanUrl(getUpdatedReleaseRes.artwork.full_size)
					: '/cd_cover.png',
				thumb_medium: getUpdatedReleaseRes.artwork?.thumb_medium
					? cleanUrl(getUpdatedReleaseRes.artwork.thumb_medium)
					: '/cd_cover.png',
				thumb_small: getUpdatedReleaseRes.artwork?.thumb_small
					? cleanUrl(getUpdatedReleaseRes.artwork.thumb_small)
					: '/cd_cover.png',
			},
		};
		// Actualizar el release en la base de datos
		const updatedRelease = await Release.findOneAndUpdate(
			{ external_id: params.id },
			{ $set: dataToUpdate },
			{ new: true }
		);

		if (!updatedRelease) {
			return NextResponse.json(
				{ success: false, message: 'Error al actualizar el release' },
				{ status: 500 }
			);
		}

		try {
			// Crear el log
			const logData = {
				action: 'UPDATE' as const,
				entity: 'RELEASE' as const,
				entityId: updatedRelease._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Release actualizado: ${updatedRelease.name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}

		return NextResponse.json({
			success: true,
			message: 'Release actualizado exitosamente',
			data: updatedRelease,
		});
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
