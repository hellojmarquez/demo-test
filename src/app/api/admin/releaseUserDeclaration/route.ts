export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

import { createLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
	console.log(' release USER DECLARATION received');

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

		const formData = await req.formData();

		// Parsear campos individuales
		const doc = formData.get('file') as File | null;
		const user_declaration = Number(formData.get('user_declaration')) || null;
		const release = Number(formData.get('release')) || null;

		// if (picture) {
		// 	const uploadArtworkReq = await fetch(
		// 		`${
		// 			process.env.MOVEMUSIC_API
		// 		}/obtain-signed-url-for-upload/?filename=${picture.name.replaceAll(
		// 			' ',
		// 			''
		// 		)}&filetype=${picture.type}&upload_type=release.artwork`,
		// 		{
		// 			method: 'GET',
		// 			headers: {
		// 				'Content-Type': 'application/json',
		// 				Authorization: `JWT ${moveMusicAccessToken}`,
		// 				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
		// 				Referer: process.env.MOVEMUSIC_REFERER || '',
		// 			},
		// 		}
		// 	);
		// 	const uploadArtworkRes = await uploadArtworkReq.json();

		// 	// Extraer la URL y los campos del objeto firmado
		// 	const { url: signedUrl, fields: resFields } = uploadArtworkRes.signed_url;
		// 	// Crear un objeto FormData y agregar los campos y el archivo
		// 	const pictureFormData = new FormData();
		// 	Object.entries(resFields).forEach(([key, value]) => {
		// 		if (typeof value === 'string' || value instanceof Blob) {
		// 			pictureFormData.append(key, value);
		// 		} else {
		// 			console.warn(
		// 				`El valor de '${key}' no es un tipo válido para FormData:`,
		// 				value
		// 			);
		// 		}
		// 	});

		// 	pictureFormData.append('file', picture);

		// 	// Realizar la solicitud POST a la URL firmada
		// 	const uploadResponse = await fetch(signedUrl, {
		// 		method: 'POST',
		// 		body: pictureFormData,
		// 	});
		// 	console.log('uploadResponse: ', uploadResponse);

		// 	picture_url = uploadResponse?.headers?.get('location') || '';
		// 	const picture_path_decoded = decodeURIComponent(
		// 		new URL(picture_url).pathname.slice(1)
		// 	);
		// 	picture_path = picture_path_decoded.replace('media/', '');
		// 	if (!uploadResponse.ok) {
		// 		return NextResponse.json(
		// 			{
		// 				success: false,
		// 				error:
		// 					uploadResponse.statusText ||
		// 					'Error al subir el archivo de audio a S3',
		// 			},
		// 			{ status: uploadResponse.status || 400 }
		// 		);
		// 	}
		// }

		// const releaseToApi = await fetch(`${process.env.MOVEMUSIC_API}/releases`, {
		// 	method: 'POST',
		// 	headers: {
		// 		'Content-Type': 'application/json',
		// 		Authorization: `JWT ${moveMusicAccessToken}`,
		// 		'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
		// 		Referer: process.env.MOVEMUSIC_REFERER || '',
		// 	},
		// 	body: JSON.stringify(releaseToApiData),
		// });

		// const apiRes = await releaseToApi.json();
		// console.log('apiRes: ', apiRes);
		// if (!apiRes.id) {
		// 	return NextResponse.json(
		// 		{
		// 			success: false,
		// 			error: apiRes || 'Error al crear el release',
		// 		},
		// 		{ status: 400 }
		// 	);
		// }
		// const getRelease = await fetch(
		// 	`${process.env.MOVEMUSIC_API}/releases/${apiRes.id}`,
		// 	{
		// 		method: 'GET',
		// 		headers: {
		// 			'Content-Type': 'application/json',
		// 			Authorization: `JWT ${moveMusicAccessToken}`,
		// 			'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
		// 			Referer: process.env.MOVEMUSIC_REFERER || '',
		// 		},
		// 	}
		// );
		// const getReleaseRes = await getRelease.json();
		// console.log('getReleaseRes: ', getReleaseRes);
		// await dbConnect();

		// const cleanUrl = (url: string) => {
		// 	return url.split('?')[0];
		// };

		// try {
		// 	// Crear el log
		// 	const logData = {
		// 		action: 'CREATE' as const,
		// 		entity: 'RELEASE' as const,
		// 		entityId: savedRelease._id.toString(),
		// 		userId: verifiedPayload.id as string,
		// 		userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
		// 		userRole: verifiedPayload.role as string,
		// 		details: `Release creado: ${name}`,
		// 		ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
		// 	};

		// 	await createLog(logData);
		// } catch (logError) {
		// 	console.error('Error al crear el log:', logError);
		// 	// No interrumpimos el flujo si falla el log
		// }


		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error('Error creating release:', error);
		return NextResponse.json(
			{ success: false, error: 'Error al crear el release' },
			{ status: 500 }
		);
	}
}
