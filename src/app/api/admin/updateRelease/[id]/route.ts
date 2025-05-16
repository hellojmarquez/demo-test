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
	console.log('releasebyid');
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

		console.log('Datos del release recibidos:', {
			newArtists: releaseData.newArtists,
			totalNewArtists: releaseData.newArtists?.length || 0,
			newTracks: releaseData.newTracks,
			totalNewTracks: releaseData.newTracks?.length || 0,
		});

		// Procesar los nuevos artistas
		if (releaseData.newArtists && releaseData.newArtists.length > 0) {
			console.log('Procesando nuevos artistas...');
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
					console.log('Resultado de creación de artista:', artistResult);
					releaseData.artists.push(artistResult.artist);
				} catch (error) {
					console.error('Error al procesar artista:', error);
				}
			}
		}

		// Procesar los nuevos tracks
		if (releaseData.newTracks && releaseData.newTracks.length > 0) {
			console.log('Procesando nuevos tracks...', releaseData.newTracks);
			for (const track of releaseData.newTracks) {
				try {
					console.log('Procesando track:', track);
					const trackFormData = new FormData();
					const trackData = {
						order: (releaseData.tracks?.length || 0) + 1,
						name: track.title,
						mix_name: track.mixName || '',
						language: 'AB',
						vocals: 'ZXX',
						artists: [],
						publishers: [],
						contributors: [],
						label_share: '',
						genre: { id: 3, name: 'Alternative' },
						subgenre: { id: 90, name: 'Alternative' },
						dolby_atmos_resource: '',
						copyright_holder: 'ISLA sOUNDS',
						copyright_holder_year: '2025',
						album_only: true,
						sample_start: '',
						explicit_content: true,
						ISRC: '',
						generate_isrc: true,
						DA_ISRC: '',
						track_lenght: '',
					};

					console.log('Datos del track a crear:', trackData);
					trackFormData.append('data', JSON.stringify(trackData));
					trackFormData.append('file', track.file);

					const trackResponse = await fetch(
						`${req.nextUrl.origin}/api/admin/createSingle`,
						{
							method: 'POST',
							body: trackFormData,
						}
					);

					const trackResult = await trackResponse.json();
					console.log('Resultado de creación de track:', trackResult);

					if (trackResult.success) {
						console.log('Track creado exitosamente, agregando al release...');
						releaseData.tracks.push({
							external_id: Number(trackResult.data.external_id),
							resource: trackResult.data.resource,
							title: trackResult.data.name,
							mixName: track.mixName || '',
						});
						console.log(
							'Estado actual de tracks en releaseData:',
							releaseData.tracks
						);
					}
				} catch (error) {
					console.error('Error al procesar track:', error);
				}
			}
		}

		// Verificar si picture es una nueva imagen o un link existente
		if (picture) {
			if (picture instanceof File) {
				// Es una nueva imagen
				console.log('Nueva imagen recibida:', picture.name);
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

				const picture_url = uploadResponse?.headers?.get('location') || '';
				releaseData.picture = picture_url;
			} else {
				// Es un link existente
				console.log('Link de imagen existente:', picture);
				releaseData.picture = picture;
			}
		}

		// Convertir los valores a números
		if (releaseData.label) releaseData.label = Number(releaseData.label);
		if (releaseData.publisher)
			releaseData.publisher = Number(releaseData.publisher);
		if (releaseData.genre) releaseData.genre = Number(releaseData.genre);
		if (releaseData.subgenre)
			releaseData.subgenre = Number(releaseData.subgenre);

		await dbConnect();

		// Actualizar el release con los nuevos datos
		const updatedRelease = await Release.findByIdAndUpdate(
			params.id,
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
			data: updatedRelease,
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
