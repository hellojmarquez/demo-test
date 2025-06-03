// app/api/admin/updateRelease/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import Release from '@/models/ReleaseModel';

import { jwtVerify } from 'jose';

interface Track {
	external_id: number;
	title: string;
	mixName: string;
	resource: string;
	_id: string;
}

interface ReleaseDocument {
	_id: string;
	external_id: number;
	tracks: Track[];
	// ... otros campos que necesites
}

export async function POST(
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
		const externalId = params.id;
		const release = (await Release.findOne({
			external_id: externalId,
		}).lean()) as ReleaseDocument;
		console.log('release', release);
		if (!release) {
			return NextResponse.json(
				{ success: false, error: 'Release not found' },
				{ status: 404 }
			);
		}

		// Procesar cada track del release
		// const dataTracks = [];
		// for (const track of release.tracks) {
		// 	try {
		// 		// Construir la URL para getTrackById
		// 		const trackUrl = new URL(
		// 			`${req.nextUrl.origin}/api/admin/getTrackById/${track.external_id}`
		// 		);

		// 		// Hacer la petición a getTrackById
		// 		const trackResponse = await fetch(trackUrl.toString(), {
		// 			method: 'GET',
		// 			headers: {
		// 				'Content-Type': 'application/json',
		// 				Cookie: `loginToken=${token};`,
		// 			},
		// 		});

		// 		if (!trackResponse.ok) {
		// 			console.error(
		// 				`Error al obtener track ${track.external_id}:`,
		// 				await trackResponse.text()
		// 			);
		// 			continue; // Continuar con el siguiente track si hay error
		// 		}

		// 		const trackData = await trackResponse.json();
		// 		console.log('trackData obtenido de get', trackData);
		// 		const track_path = decodeURIComponent(
		// 			new URL(trackData.data.resource).pathname.slice(1)
		// 		);
		// 		trackData.data.resource = track_path;

		// 		dataTracks.push(trackData.data);
		// 		// Aquí puedes agregar la lógica adicional que necesites con los datos del track
		// 	} catch (error) {
		// 		console.error(`Error procesando track ${track.external_id}:`, error);
		// 		continue; // Continuar con el siguiente track si hay error
		// 	}
		// }
		// release.tracks = dataTracks;
		// console.log('dataTracks', dataTracks);
		// console.log('release completo', release);
		const distributeReq = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/update-status/`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify({
					id: externalId,
					action: 'distribute',
				}),
			}
		);

		const distributeRes = await distributeReq.json();
		console.log('distributeRes', distributeRes);
		if (distributeRes.error) {
			console.log('distribute ERROR', distributeRes);
			return NextResponse.json(
				{
					success: false,
					message: distributeRes.message,
				},
				{ status: 400 }
			);
		}
		return NextResponse.json({
			success: true,
			message: 'Release en revisión',
		});
	} catch (error: any) {
		console.error('Error al distribuir el release:', error);
		return NextResponse.json(
			{
				success: false,
				message: error.message || 'Error al actualizar el release',
			},
			{ status: 500 }
		);
	}
}
