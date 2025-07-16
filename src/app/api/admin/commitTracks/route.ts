import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import Release from '@/models/ReleaseModel';
import TempTrack from '@/models/TempTrack';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';
import FormData from 'form-data';
import nodeFetch from 'node-fetch';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import { parseFile } from 'music-metadata';

export async function POST(req: NextRequest) {
	try {
		// Verificar autenticación
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;
		const token = req.cookies.get('loginToken')?.value;
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

		// Obtener datos del body
		const { sessionId, action } = await req.json();

		if (!sessionId || !action) {
			return NextResponse.json(
				{ success: false, error: 'SessionId y action son requeridos' },
				{ status: 400 }
			);
		}

		await dbConnect();

		if (action === 'commit') {
			// Obtener todos los tracks temporales de la sesión
			const tempTracks = await TempTrack.find({ sessionId });

			if (tempTracks.length === 0) {
				return NextResponse.json(
					{
						success: false,
						error: 'No se encontraron tracks temporales para esta sesión',
					},
					{ status: 404 }
				);
			}

			// Crear transacción para procesar todos los tracks
			const session = await dbConnect().then(() =>
				require('mongoose').startSession()
			);
			session.startTransaction();
			const processedTracks: any[] = [];
			const DEFAULT_RELEASE = Number(process.env.DEFAULT_RELEASE) || 0;
			try {
				for (const tempTrack of tempTracks) {
					let picture_url = '';
					let picture_path = '';
					const getRelease = await fetch(
						`http://localhost:3000/api/admin/getReleaseById/${tempTrack.trackData.release}`,
						{
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
								Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken};refreshToken=${refresh_token}`,
							},
						}
					);

					if (!getRelease.ok) {
						const err = await getRelease.json();
						return NextResponse.json(
							{ success: false, error: err || 'Error al obtener el release' },
							{ status: 400 }
						);
					}
					const releaseData = await getRelease.json();
					const existingTrack = releaseData.data.tracks.find(
						(track: any) => track.title === tempTrack.trackData.name
					);
					if (existingTrack) {
						console.log('el track ya existe en el release');
						return NextResponse.json(
							{
								success: false,
								error: `El track ${existingTrack.title} ya existe en el release`,
							},
							{ status: 400 }
						);
					}
					// 1. Subir archivo a API externa
					const fileStream = createReadStream(tempTrack.tempFilePath);
					const { size } = await fs.stat(tempTrack.tempFilePath);
					const sizeInMB = size / 1024 / 1024;
					const metadata = await parseFile(tempTrack.tempFilePath);
					const { sampleRate, bitsPerSample } = metadata.format;
					const formData = new FormData();
					const releaseId =
						tempTrack.trackData.release && tempTrack.trackData.release !== 0
							? tempTrack.trackData.release
							: DEFAULT_RELEASE;
					tempTrack.trackData.release = releaseId;
					const formattedName = tempTrack.trackData.name.replaceAll(' ', '');

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

					try {
						const uploadTrackRes = await uploadTrackReq.json();
						if (!uploadTrackRes.signed_url) {
							console.log('error al obtener la URL firmada');
							return NextResponse.json(
								{ success: false, error: 'Error al obtener la URL firmada' },
								{ status: 400 }
							);
						}
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

						trackFormData.append('file', fileStream, {
							filename: fixedFileName,
							contentType: 'audio/wav',
							knownLength: size,
						});
						const uploadResponse = await nodeFetch(signedUrl, {
							method: 'POST',
							body: trackFormData,
							headers: trackFormData.getHeaders(),
						});

						picture_url = `${signedUrl}${trackFields.key}`;
						const picture_path_decoded = decodeURIComponent(
							new URL(picture_url).pathname.slice(1)
						);
						picture_path = picture_path_decoded.replace('media/', '');
					} catch (error) {
						console.error('Error al obtener la URL firmada:', error);
						return NextResponse.json(
							{ success: false, error: 'Error al obtener la URL firmada' },
							{ status: 400 }
						);
					} finally {
						if (tempTrack.tempFilePath) {
							await fs.unlink(tempTrack.tempFilePath);
						}
					}

					if (releaseData) {
						tempTrack.trackData.order = releaseData.data.tracks.length;
					}

					if (releaseData.is_new_release) {
						tempTrack.trackData.release_version = releaseData.release_version;
					}

					let dataToapi = JSON.parse(JSON.stringify(tempTrack.trackData));

					dataToapi.name = dataToapi.title;
					dataToapi.resource = picture_path.length > 0 && picture_path;
					delete dataToapi.title;
					delete dataToapi.file;
					delete dataToapi.id;
					delete dataToapi.status;
					delete dataToapi.available;
					delete dataToapi.genre_name;
					delete dataToapi.subgenre_name;
					// Asegurar que publishers tenga la estructura correcta
					if (Array.isArray(dataToapi.publishers)) {
						dataToapi.publishers = dataToapi.publishers.map((pub: any) => ({
							order: pub.order || 0,
							publisher: Number(pub.publisher) || 0,
							author: pub.author || '',
						}));
					} else {
						dataToapi.publishers = [];
					}
					if (Array.isArray(dataToapi.artists)) {
						dataToapi.artists = dataToapi.artists.map((pub: any) => {
							if (pub.name) delete pub.name;
							return {
								order: pub.order || 0,
								artist: Number(pub.artist) || 0,
								kind: pub.kind || '',
							};
						});
					} else {
						dataToapi.artists = [];
					}

					if (Array.isArray(dataToapi.contributors)) {
						dataToapi.contributors = dataToapi.contributors.map(
							(cont: any) => ({
								order: cont.order || 0,
								contributor: Number(cont.contributor) || 0,
								role: Number(cont.role) || 0,
							})
						);
					} else {
						dataToapi.contributors = [];
					}

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

					if (!trackReq.ok) {
						const trackRes = await trackReq.json();
						console.log('error al crear el track');
						return NextResponse.json(
							{
								success: false,
								error:
									trackRes ||
									'Ha habido un error, estamos trabajando para arreglarlo',
							},
							{ status: 400 }
						);
					}
					const trackRes = await trackReq.json();
					// Actualizar trackData con los campos corregidos
					tempTrack.trackData.external_id = trackRes.id;
					if (trackRes.ISRC) {
						tempTrack.trackData.ISRC = trackRes.ISRC;
					}
					if (trackRes.DA_ISRC) {
						tempTrack.trackData.DA_ISRC = trackRes.DA_ISRC;
					}
					tempTrack.trackData.resource = picture_url;

					// Crear el track
					const createTrack = await SingleTrack.create(tempTrack.trackData);
					processedTracks.push(createTrack);
					const dataToRelease = {
						title: tempTrack.trackData.name,
						mixName: tempTrack.trackData.mix_name,
						external_id: tempTrack.trackData.external_id,
						resource: picture_url,
						available: tempTrack.trackData.available,
					};

					const updatedRelease = await Release.findOneAndUpdate(
						{ external_id: tempTrack.trackData.release },
						{ $push: { tracks: dataToRelease } },
						{ new: true }
					);

					try {
						// Crear el log
						const logData = {
							action: 'CREATE' as const,
							entity: 'PRODUCT' as const,
							entityId: createTrack._id.toString(),
							userId: verifiedPayload.id as string,
							userName:
								(verifiedPayload.name as string) || 'Usuario sin nombre',
							userRole: verifiedPayload.role as string,
							details: `Track creado: ${createTrack.name}`,
							ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
						};

						await createLog(logData);
					} catch (logError) {
						console.error('Error al crear el log:', logError);
						// No interrumpimos el flujo si falla el log
					}
				}
				await session.commitTransaction();

				// Eliminar tracks temporales
				await TempTrack.deleteMany({ sessionId });

				return NextResponse.json(
					{
						success: true,
						data: processedTracks,
						message: `${processedTracks.length} tracks procesados exitosamente`,
					},
					{ status: 201 }
				);
			} catch (error) {
				await session.abortTransaction();
				console.error('Error durante el commit:', error);
				throw error;
			} finally {
				session.endSession();
			}
		} else if (action === 'rollback') {
			// Eliminar tracks temporales y archivos temporales
			const tempTracks = await TempTrack.find({ sessionId });

			for (const tempTrack of tempTracks) {
				// Eliminar archivo temporal
				if (tempTrack.tempFilePath) {
					try {
						await fs.unlink(tempTrack.tempFilePath);
					} catch (error) {
						console.error('Error al eliminar archivo temporal:', error);
					}
				}
			}

			// Eliminar tracks temporales
			await TempTrack.deleteMany({ sessionId });

			return NextResponse.json({
				success: true,
				message: 'Tracks temporales eliminados completamente',
				deletedTracks: tempTracks.length,
			});
		} else {
			return NextResponse.json(
				{ success: false, error: 'Action debe ser "commit" o "rollback"' },
				{ status: 400 }
			);
		}
	} catch (error: any) {
		console.error('Error en commitTracks:', error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
