// app/api/admin/updateSingle/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import { jwtVerify } from 'jose';
import Release from '@/models/ReleaseModel';
import { createLog } from '@/lib/logger';

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

		// Get the current track first
		const currentTrack = await SingleTrack.findOne({ external_id: trackId });
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

				if (file) {
					const uploadTrackReq = await fetch(
						`${
							process.env.MOVEMUSIC_API
						}/obtain-signed-url-for-upload/?filename=${file.name.replaceAll(
							' ',
							''
						)}&filetype=${file.type}&upload_type=track.audio`,
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

					track_url = uploadResponse?.headers?.get('location') || '';
					if (track_url)
						track_path = decodeURIComponent(
							new URL(track_url).pathname.slice(1).replace('media/', '')
						);

					if (!uploadResponse.ok) {
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
		} else {
			return NextResponse.json(
				{ success: false, error: 'Invalid content type' },
				{ status: 400 }
			);
		}
		console.log('trackData antes del map', trackData);
		trackData.resource =
			track_path.length > 0
				? track_path
				: decodeURIComponent(
						new URL(currentTrack.resource).pathname
							.slice(1)
							.replace('media/', '')
				  );
		if (trackData.ISRC === null) delete trackData.ISRC;
		let publisherstoapi: any[] = [];
		// Asegurar que publishers tenga la estructura correcta
		if (Array.isArray(trackData.publishers)) {
			publisherstoapi = trackData.publishers.map((pub: any) => ({
				order: pub.order || 0,
				publisher: pub.publisher || 0,
				author: pub.author || '',
			}));
		} else {
			publisherstoapi = [];
		}
		let contributorsToApi: any[] = [];
		// Asegurar que contributors tenga la estructura correcta
		if (Array.isArray(trackData.contributors)) {
			contributorsToApi = trackData.contributors.map((cont: any) => ({
				order: cont.order || 0,
				contributor: cont.contributor || 0,
				role: cont.role || 0,
			}));
		} else {
			contributorsToApi = [];
		}
		let artistsToApi: any[] = [];
		// Asegurar que contributors tenga la estructura correcta
		if (Array.isArray(trackData.artists)) {
			artistsToApi = trackData.artists.map((art: any) => ({
				order: art.order || 0,
				artist: art.artist || 0,
				kind: art.kind || '',
			}));
		} else {
			artistsToApi = [];
		}

		console.log('trackData', trackData);
		const trackToApi = await fetch(
			`${process.env.MOVEMUSIC_API}/tracks/${trackData.external_id}`,
			{
				method: 'PUT',
				body: JSON.stringify({
					...trackData,
					publishers: publisherstoapi,
					artists: artistsToApi,
					contributors: contributorsToApi,
				}),
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);
		console.log('trackToApi STATUS', trackToApi.ok);

		const apires = await trackToApi.json();
		console.log('apires', apires);
		if (!apires.id) {
			return NextResponse.json(
				{ success: false, error: apires || 'Error al actualizar el track' },
				{ status: 400 }
			);
		}
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
		console.log('trackData a base de datos', trackData);
		// Actualizar el track
		const updatedTrack = await SingleTrack.findOneAndUpdate(
			{ external_id: trackId },
			trackData,
			{ new: true }
		);
		const dataToRelease = {
			title: trackData.name,
			mixName: trackData.mix_name,
			external_id: trackData.external_id,
			resource: track_url,
		};
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
		console.log('updatedRelease: ', updatedRelease);
		if (!updatedRelease) {
			return NextResponse.json(
				{ success: false, error: 'No se encontró el release para actualizar' },
				{ status: 404 }
			);
		}
		try {
			// Crear el log
			const logData = {
				action: 'UPDATE' as const,
				entity: 'PRODUCT' as const,
				entityId: updatedTrack._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Track actualizado: ${updatedTrack.name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json({
			success: true,
			track: {
				external_id: updatedTrack?.external_id,
				resource: updatedTrack?.resource,
				title: updatedTrack?.name,
				mixName: updatedTrack?.mix_name,
			},
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
