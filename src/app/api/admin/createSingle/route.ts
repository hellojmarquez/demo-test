import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';
import Release from '@/models/ReleaseModel';

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

		const contentType = req.headers.get('content-type') || '';
		let trackData: Record<string, any> = {};

		let picture_url = '';
		let picture_path = '';
		console.log('contentType: ', contentType);
		if (contentType.includes('multipart/form-data')) {
			const formData = await req.formData();
			const file = formData.get('file') as File | null;
			let data = formData.get('data') as string | null;

			if (data) {
				trackData = JSON.parse(data);
				if (!file) {
					return NextResponse.json(
						{ success: false, error: 'Archivo de audio requerido' },
						{ status: 400 }
					);
				}
				if (file) {
					let fixedFileName = '';
					if (file.name) {
						fixedFileName = file.name.replaceAll(' ', '');
					}
					const uploadTrackReq = await fetch(
						`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${fixedFileName}&filetype=${file.type}&upload_type=track.audio`,
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
					console.log('uploadTrackRes: ', uploadTrackRes);
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

					picture_url = uploadResponse.headers?.get('location') || '';
					const picture_path_decoded = decodeURIComponent(
						new URL(picture_url).pathname.slice(1)
					);
					picture_path = picture_path_decoded.replace('media/', '');

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
							{ status: 401 }
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

		const getRelease = await fetch(
			`${req.nextUrl.origin}/api/admin/getReleaseById/${trackData.release}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
				},
			}
		);

		const releaseData = await getRelease.json();

		const existingTrack = releaseData.data.tracks.find(
			(track: any) => track.title === trackData.name
		);
		if (existingTrack) {
			console.log('existingTrack: ', existingTrack);
			return NextResponse.json(
				{
					success: false,
					error: `El track ${existingTrack.title} ya existe en el release`,
				},
				{ status: 400 }
			);
		}
		if (releaseData.is_new_release) {
			trackData.release_version = releaseData.release_version;
		}
		trackData.resource = picture_path;
		let dataToapi = JSON.parse(JSON.stringify(trackData));
		delete dataToapi.available;
		// Asegurar que publishers tenga la estructura correcta
		if (Array.isArray(dataToapi.publishers)) {
			dataToapi.publishers = dataToapi.publishers.map((pub: any) => ({
				order: pub.order || 0,
				publisher: pub.publisher || 0,
				author: pub.author || '',
			}));
		} else {
			dataToapi.publishers = [];
		}

		// Asegurar que contributors tenga la estructura correcta
		if (Array.isArray(dataToapi.contributors)) {
			dataToapi.contributors = dataToapi.contributors.map((cont: any) => ({
				order: cont.order || 0,
				contributor: cont.contributor || 0,
				role: cont.role || 0,
			}));
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
			return NextResponse.json(
				{
					success: false,
					error:
						trackReq.statusText ||
						'Ha habido un error, estamos trabajando para arreglarlo',
				},
				{ status: 400 }
			);
		}

		const trackRes = await trackReq.json();

		// Actualizar trackData con los campos corregidos
		trackData.external_id = trackRes.id;
		trackData.resource = picture_url;

		// Crear el track
		const createTrack = await SingleTrack.create(trackData);

		if (!createTrack.external_id) {
			return NextResponse.json(
				{
					success: false,
					error: 'Error al crear el track en la base de datos',
				},
				{ status: 400 }
			);
		}
		const dataToRelease = {
			title: trackData.name,
			mixName: trackData.mix_name,
			external_id: trackData.external_id,
			resource: picture_url,
			available: trackData.available,
		};

		const updatedRelease = await Release.findOneAndUpdate(
			{ external_id: trackData.release },
			{ $push: { tracks: dataToRelease } },
			{ new: true }
		);

		if (!updatedRelease) {
			return NextResponse.json(
				{ success: false, error: 'No se encontró el release para actualizar' },
				{ status: 404 }
			);
		}

		try {
			// Crear el log
			const logData = {
				action: 'CREATE' as const,
				entity: 'PRODUCT' as const,
				entityId: createTrack._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Track creado: ${createTrack.name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json(
			{ success: true, data: createTrack },
			{ status: 201 }
		);
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
