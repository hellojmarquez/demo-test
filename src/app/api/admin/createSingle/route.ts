import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';

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

		if (contentType.includes('multipart/form-data')) {
			const formData = await req.formData();
			const file = formData.get('file') as File | null;
			let data = formData.get('data') as string | null;

			if (data) {
				trackData = JSON.parse(data);

				if (file) {
					console.log('CREANDO TRAck');
					console.log('FILE', file);
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
					console.log('SIGNED URL', signedUrl);

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
					console.log('UPLOAD RESPONSE', uploadResponse);
					picture_url = uploadResponse.headers?.get('location') || '';
					picture_path = decodeURIComponent(
						new URL(picture_url).pathname.slice(1)
					);

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

		trackData.resource = picture_path;
		console.log('url', picture_url);
		console.log('path', picture_path);
		let dataToapi = JSON.parse(JSON.stringify(trackData));

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
		console.log('DATA TO API', dataToapi);
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
		console.log('TRACK REQUEST ok', trackReq.ok);
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
		console.log('TRACK DATA PARA CREAR EN BBDD', trackData);
		// Crear el track
		const createTrack = await SingleTrack.create(trackData);
		console.log('createTrack MONGO', createTrack);
		if (!createTrack.external_id) {
			return NextResponse.json(
				{
					success: false,
					error: 'Error al crear el track en la base de datos',
				},
				{ status: 400 }
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
		return NextResponse.json({
			success: true,
			track: trackData,
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
