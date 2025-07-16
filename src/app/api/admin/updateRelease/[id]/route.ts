// app/api/admin/updateRelease/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import Release from '@/models/ReleaseModel';
import dbConnect from '@/lib/dbConnect';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';
import FormData from 'form-data';
import nodeFetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
		const spotify_token = req.cookies.get('stkn')?.value;
		const refresh_token = req.cookies.get('refreshToken')?.value;
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
		const file = formData.get('fileName') as string;
		let picture_url = '';
		let picture_path = '';
		if (!data) {
			return NextResponse.json(
				{ success: false, message: 'No se proporcionaron datos' },
				{ status: 400 }
			);
		}
		const releaseData = JSON.parse(data as string);
		let tempFilePath: string | null = null;
		const chunk = formData.get('chunk') as Blob;
		const chunkIndex = parseInt(formData.get('chunkIndex') as string);
		const totalChunks = parseInt(formData.get('totalChunks') as string);

		if (file) {
			if (isNaN(chunkIndex) || isNaN(totalChunks)) {
				return NextResponse.json(
					{ success: false, error: 'Datos de chunk inválidos' },
					{ status: 400 }
				);
			}
			const tempDir = path.join(process.cwd(), 'temp_uploads');
			await fs.mkdir(tempDir, { recursive: true });

			// Define el nombre del archivo temporal. ESTO DEBE ESTAR FUERA DEL IF.
			const safeFileName = file.replace(/[^a-zA-Z0-9._-]/g, '_');
			const tempFileName = `upload_${safeFileName}.tmp`;
			tempFilePath = path.join(tempDir, tempFileName);
			const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
			await fs.appendFile(tempFilePath, chunkBuffer);

			if (chunkIndex < totalChunks - 1) {
				return NextResponse.json({
					success: true,
					message: `Chunk ${chunkIndex} recibido`,
				});
			}
			if (!tempFilePath) {
				return NextResponse.json(
					{ success: false, error: 'Archivo de audio requerido' },
					{ status: 400 }
				);
			}
			const { size: fileSize } = await fs.stat(tempFilePath);
			const fileBuffer = await fs.readFile(tempFilePath);
			const metadata = await sharp(fileBuffer).metadata();
			const sizeInMB = fileSize / 1024 / 1024;

			if (
				metadata.width !== 3000 ||
				metadata.height !== 3000 ||
				(metadata.format !== 'jpeg' && metadata.format !== 'jpg') ||
				(metadata.space !== 'srgb' && metadata.space !== 'rgb')
			) {
				await fs.unlink(tempFilePath);
				return NextResponse.json(
					{
						success: false,
						error: 'La imagen no tiene el formato o características soportadas',
					},
					{ status: 400 }
				);
			}
			if (sizeInMB > 4) {
				await fs.unlink(tempFilePath);
				return NextResponse.json(
					{
						success: false,
						error: 'La imagen es debe pesar máximo 4MB',
					},
					{ status: 400 }
				);
			}
			const modifiedBuffer = await sharp(fileBuffer)
				.withMetadata({ density: 72 })
				.toBuffer();
			const fixedname = file.replaceAll(' ', '_');
			const uploadArtworkReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${fixedname}&filetype=image/jpeg&upload_type=release.artwork`,
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
			if (!uploadArtworkReq.ok) {
				return NextResponse.json(
					{ success: false, error: 'Error al obtener la URL de subida' },
					{ status: 400 }
				);
			}
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

			pictureFormData.append('file', modifiedBuffer, {
				filename: fixedname,
				contentType: 'image/jpeg',
				knownLength: fileSize,
			});
			const uploadResponse = await nodeFetch(signedUrl, {
				method: 'POST',
				body: pictureFormData,
				headers: pictureFormData.getHeaders(),
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
						`http://localhost:3000/api/admin/createArtistInRelease`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken};spotify_token=${spotify_token};refreshToken=${refresh_token}`,
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
						return NextResponse.json(
							{ success: false, error: createArtistRes },
							{ status: 400 }
						);
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
		// Primero actualizar releaseData.artists
		releaseData.artists = releaseData.artists.map(
			(artist: any, index: number) => {
				return { ...artist, order: index };
			}
		);

		// Luego crear artistToApi usando los mismos datos ya procesados
		const artistToApi = {
			artists: releaseData.artists.map(
				(artist: { name: string; [key: string]: any }) => {
					const { name, ...rest } = artist;
					return rest; // Ya tiene el order correcto de la línea anterior
				}
			),
		};

		const decodedReleaseArtWork = decodeURIComponent(
			new URL(release.picture.full_size).pathname.slice(1)
		);
		const formattedArtwork = decodedReleaseArtWork.replace('media/', '');

		const releaseToApiData = {
			...releaseData,
			artists: artistToApi.artists,
			artwork: picture_path.length > 0 ? picture_path : formattedArtwork,
		};
		if (releaseToApiData.tracks) delete releaseToApiData.tracks;

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

		if (!releaseToApi.ok) {
			const apiRes = await releaseToApi.json();
			return NextResponse.json(
				{
					success: false,
					error: apiRes || 'Error PATCH al actualizar el el producto+',
				},
				{ status: 400 }
			);
		}
		const apiRes = await releaseToApi.json();

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

		if (!getUpdatedRelease.ok) {
			const getUpdatedReleaseRes = await getUpdatedRelease.json();
			return NextResponse.json(
				{
					success: false,
					error: getUpdatedReleaseRes || 'Error GET al obtener el release',
				},
				{ status: 404 }
			);
		}
		const getUpdatedReleaseRes = await getUpdatedRelease.json();

		const dataToUpdate = {
			...releaseData,
			status: getUpdatedReleaseRes.status
				? getUpdatedReleaseRes.status
				: releaseData.status,
			label: releaseData.label,
			artists: releaseData.artists,
			qc_feedback: getUpdatedReleaseRes.qc_feedback
				? getUpdatedReleaseRes.qc_feedback
				: null,
			acr_alert: getUpdatedReleaseRes.acr_alert
				? getUpdatedReleaseRes.acr_alert
				: null,
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
				{ status: 400 }
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
		const errorDetails = {
			message: error.message || 'Error desconocido',
			name: error.name || 'Error',
			code: error.code,
			status: error.status,
			statusCode: error.statusCode,
			response: error.response,
			isAxiosError: error.isAxiosError,
			// Capturar propiedades adicionales
			...Object.getOwnPropertyNames(error).reduce((acc, prop) => {
				try {
					acc[prop] = error[prop];
				} catch (e) {
					acc[prop] = `[Error al acceder a ${prop}]`;
				}
				return acc;
			}, {} as any),
		};

		// Log detallado en consola del servidor
		console.error('�� ERROR DETALLADO EN updateRelease:', {
			timestamp: new Date().toISOString(),
			endpoint: '/api/admin/updateRelease/[id]',
			error: errorDetails,
			originalError: error,
			environment: process.env.NODE_ENV,
		});

		// Enviar respuesta detallada al frontend
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
