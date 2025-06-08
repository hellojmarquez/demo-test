import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;
		const token = request.cookies.get('loginToken')?.value;
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

		if (!id) {
			return NextResponse.json(
				{ success: false, message: 'ID is required' },
				{ status: 400 }
			);
		}

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json(
				{ success: false, message: 'Invalid ID format' },
				{ status: 400 }
			);
		}

		await dbConnect();

		const getTrack = await fetch(
			`${request.nextUrl.origin}/api/admin/getTrackById/${id}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken}`,
				},
			}
		);
		if (!getTrack) {
			return NextResponse.json(
				{ success: false, message: getTrack || 'Error al obtener el track' },
				{ status: 500 }
			);
		}
		const trackData = await getTrack.json();
		const track = trackData.data;
		let newISRC = '';
		if (track.ISRC && typeof track.ISRC === 'string' && track.ISRC.length > 0) {
			newISRC = track.ISRC;
		}
		let newresource = '';
		if (
			track.resource &&
			typeof track.resource === 'string' &&
			track.resource.length > 0
		) {
			try {
				const decodedResource = decodeURIComponent(
					new URL(track.resource).pathname.slice(1)
				);
				newresource = decodedResource.replace('media/', '');
				console.log('NEW RESOURCE: ', newresource);
			} catch (error) {
				console.log('NEW RESOURCE err: ', error);
				console.error('Error processing resource URL:', error);
				newresource = '';
			}
		}
		const dataToApi = {
			...track,
			release: 883,
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
		delete dataToApi.genre_name;
		delete dataToApi.subgenre_name;
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
		if (!updateTrackReq.ok) {
			return NextResponse.json(
				{
					success: false,
					message: updateTrackReq || 'Error al actualizar el track',
				},
				{ status: 500 }
			);
		}
		const updateTrackRes = await updateTrackReq.json();
		const trackToDB = await SingleTrack.findByIdAndUpdate(id, {
			$set: {
				available: false,
				ISRC: updateTrackRes.ISRC || newISRC,
				release: 883,
			},
		});
		if (!trackToDB) {
			return NextResponse.json(
				{ success: false, message: 'Error al actualizar el track' },
				{ status: 500 }
			);
		}
		try {
			// Crear el log
			const logData = {
				action: 'CREATE' as const,
				entity: 'USER' as const,
				entityId: id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Artista creado: ${track.name}`,
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
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
