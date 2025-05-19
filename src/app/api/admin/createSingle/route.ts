import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
	console.log('crerateSingle');
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
		await dbConnect();

		const contentType = req.headers.get('content-type') || '';
		let trackData: Record<string, any> = {};

		let picture_url = '';
		let picture_path = '';

		if (contentType.includes('multipart/form-data')) {
			const formData = await req.formData();
			const file = formData.get('file') as File | null;
			let data = formData.get('data') as string | null;

			if (data) {
				trackData = JSON.parse(data);
				console.log('Track data:', trackData);

				// Asegurarse de que los artistas tengan el formato correcto
				if (trackData.artists) {
					trackData.artists = trackData.artists.map((artist: any) => ({
						artist: Number(artist.artist) || 0,
						kind: String(artist.kind || 'main'),
						order: Number(artist.order || 0),
						name: String(artist.name || ''),
					}));
				}

				if (file) {
					console.log('Procesando archivo:', file.name);
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
					const trackResponse = await fetch(
						`${req.nextUrl.origin}/api/admin/createSingle`,
						{
							method: 'POST',
							headers: {
								Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
							},
							body: trackFormData,
						}
					);

					picture_url = trackResponse?.headers?.get('location') || '';
					picture_path = decodeURIComponent(
						new URL(picture_url).pathname.slice(1)
					);

					if (!trackResponse.ok) {
						console.error(
							'Error al subir el archivo de audio a S3:',
							await trackResponse.text()
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
		} else {
			return NextResponse.json(
				{ success: false, error: 'Invalid content type' },
				{ status: 400 }
			);
		}

		trackData.resource = picture_path;
		let dataToapi = JSON.parse(JSON.stringify(trackData));
		dataToapi.genre = trackData.genre.id;
		dataToapi.subgenre = trackData.subgenre.id;
		console.log('trackData', trackData);
		const trackReq = await fetch(`${process.env.MOVEMUSIC_API}/tracks/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `JWT ${moveMusicAccessToken}`,
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
			},
			body: JSON.stringify(dataToapi),
		});

		const trackRes = await trackReq.json();
		console.log('trackRes', trackRes);
		if (!trackReq.ok) {
			console.error('Error al crear el track:', trackRes);
			return NextResponse.json(
				{ success: false, error: trackRes },
				{ status: 500 }
			);
		}
		if (trackRes.success && trackRes.data) {
			trackData.external_id = trackRes.data.external_id;
			trackData.resource = picture_url;
		} else {
			return NextResponse.json(
				{ success: false, error: 'Error en la respuesta de la API' },
				{ status: 500 }
			);
		}

		// Crear el track
		const createTrack = await SingleTrack.create(trackData);

		return NextResponse.json({
			success: true,
			data: createTrack,
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
