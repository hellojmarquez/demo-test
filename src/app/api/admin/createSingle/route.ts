import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import { Binary } from 'mongodb';
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
		let fileName = '';
		let resource_url = '';
		if (contentType.includes('multipart/form-data')) {
			const formData = await req.formData();
			const file = formData.get('file') as File | null;
			let data = formData.get('data') as string | null;

			if (data) {
				trackData = JSON.parse(data);
				console.log('trackData: ', trackData);
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
					fileName = file.name.toLowerCase();
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

					resource_url = signedUrl;

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
			console.log('JSON trackData:', trackData);

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

		// Asegurarse de que los campos requeridos estén presentes y con el formato correcto
		const requiredFields = {
			name: trackData.name || '',
			language: trackData.language || 'ES',
			track_length: trackData.track_lenght || '00:00:00', // Corregimos el nombre del campo
			vocals: trackData.vocals || 'ES',
			status: 'Borrador',
			artists: trackData.artists || [],
			publishers: trackData.publishers || [],
			contributors: trackData.contributors || [],
			genre: trackData.genre || null,
			subgenre: trackData.subgenre || null,
		};

		// Validar campos requeridos
		if (!requiredFields.name) {
			return NextResponse.json(
				{ success: false, error: 'El nombre del track es requerido' },
				{ status: 400 }
			);
		}

		if (!requiredFields.language) {
			return NextResponse.json(
				{ success: false, error: 'El idioma del track es requerido' },
				{ status: 400 }
			);
		}

		// Actualizar trackData con los campos corregidos
		trackData = {
			...trackData,
			...requiredFields,
		};

		console.log('Datos finales del track:', trackData);

		// Crear el track
		const createTrack = await SingleTrack.create(trackData);
		console.log('bbdd res: ', createTrack);

		return NextResponse.json({ success: true });
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
