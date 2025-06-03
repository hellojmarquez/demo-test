import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';
import Release from '@/models/ReleaseModel';

export async function DELETE(
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
		const { id } = params;
		const trackId = parseInt(id);

		if (!id) {
			return NextResponse.json(
				{ success: false, message: 'ID is required' },
				{ status: 400 }
			);
		}
		await dbConnect();
		const getTrack = await fetch(
			`${req.nextUrl.origin}/api/admin/getTrackById/${id}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
				},
			}
		);
		const trackData = await getTrack.json();
		const track = trackData.data;
		console.log('TRACK A ELIMINAR: ', track);

		let newresource = '';
		if (
			track.resource &&
			typeof track.resource === 'string' &&
			track.resource.length > 0
		) {
			try {
				newresource = decodeURIComponent(
					new URL(track.resource).pathname.slice(1)
				).replace('media/', '');
				console.log('NEW RESOURCE: ', newresource);
			} catch (error) {
				console.log('NEW RESOURCE err: ', error);
				console.error('Error processing resource URL:', error);
				newresource = '';
			}
		}

		let newISRC = '';
		if (track.ISRC && typeof track.ISRC === 'string' && track.ISRC.length > 0) {
			newISRC = track.ISRC;
		}

		const dataToApi = {
			...track,
			release: null,
			ISRC: newISRC,
			resource: newresource,
			artists: track.artists.map(
				({ name, ...rest }: { name: string; [key: string]: any }) => rest
			),
			publishers: track.publishers.map(
				({ name, ...rest }: { name: string; [key: string]: any }) => rest
			),
			contributors: track.contributors.map(
				({
					name,
					role_name,
					...rest
				}: {
					name: string;
					role_name: string;
					[key: string]: any;
				}) => rest
			),
		};
		delete dataToApi._id;
		delete dataToApi.extrernal_id;
		delete dataToApi.status;
		delete dataToApi. genre_name;
		delete dataToApi. subgenre_name;
		console.log('DATA TO API: ', dataToApi);
		const updateTrackReq = await fetch(
			`${process.env.MOVEMUSIC_API}/tracks/${track.external_id}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify(dataToApi),
			}
		);
		const updateTrackRes = await updateTrackReq.json();
		console.log('UPDATE API TRACK RES: ', updateTrackRes);
		if (!updateTrackRes.id) {
			return NextResponse.json(
				{
					success: false,
					error: updateTrackRes || 'Error al actualizar el track',
				},
				{ status: 401 }
			);
		}
		if (!track.ISRC || track.ISRC.length === 0) {
			track.ISRC = updateTrackRes.ISRC;
		}
		console.log('RESPUESTA DE API: ', updateTrackRes);

		await SingleTrack.findByIdAndUpdate(track._id, { $set: track });

		if (!SingleTrack) {
			return NextResponse.json(
				{ success: false, error: 'Error al actualizar el track' },
				{ status: 400 }
			);
		}
		const getRelease = await fetch(
			`${req.nextUrl.origin}/api/admin/getReleaseById/${track.release}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
				},
			}
		);

		const RD = await getRelease.json();
		const releaseData = RD.data;

		if (!releaseData || !releaseData.tracks) {
			return NextResponse.json(
				{
					success: false,
					message: 'No se encontró el release o no tiene tracks',
				},
				{ status: 404 }
			);
		}

		// Filtrar el track que queremos eliminar del array de tracks
		const updatedTracks = releaseData.tracks.filter(
			(track: any) => track.external_id !== trackId
		);
		console.log('UPDATED TRACKS DESPUES DE FILTRO: ', updatedTracks);
		// Actualizar el release con el nuevo array de tracks
		const updatedRelease = await Release.findOneAndUpdate(
			{ external_id: releaseData.external_id },
			{ $set: { tracks: updatedTracks } },
			{ new: true }
		);

		if (!updatedRelease) {
			return NextResponse.json(
				{ success: false, message: 'Error al actualizar el release' },
				{ status: 500 }
			);
		}

		try {
			// Crear el log
			const logData = {
				action: 'UPDATE' as const,
				entity: 'PRODUCT' as const,
				entityId: id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Track removido de release: ${track.name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json(
			{ success: true, message: 'Track eliminado exitosamente' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error eliminado track', error);
		return NextResponse.json(
			{ success: false, message: 'Error eliminado track' },
			{ status: 500 }
		);
	}
}
