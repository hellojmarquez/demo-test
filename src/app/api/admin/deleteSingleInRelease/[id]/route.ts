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
				{ success: false, error: 'Acceso no autorizado' },
				{ status: 401 }
			);
		}
		const { id } = params;
		const trackId = parseInt(id);
		const ISLA_SOUNDS_RELEASE_ID = Number(process.env.DEFAULT_RELEASE) || 0;

		if (!id) {
			return NextResponse.json(
				{ success: false, message: 'ID is required' },
				{ status: 400 }
			);
		}

		await dbConnect();
		const getTrack = await fetch(
			`http://localhost:3000/api/admin/getTrackById/${trackId}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken};refreshToken=${refresh_token}`,
				},
			}
		);

		const trackData = await getTrack.json();

		if (!trackData.data.external_id) {
			return NextResponse.json(
				{ success: false, message: 'No se encontró el track' },
				{ status: 404 }
			);
		}
		const RELEASE_TO_MODIFY = trackData.data.release;
		const track = trackData.data;

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
			} catch (error) {
				console.error('Error processing resource URL:', error);
				newresource = '';
			}
		}

		let newISRC = '';
		if (track.ISRC && typeof track.ISRC === 'string' && track.ISRC.length > 0) {
			newISRC = track.ISRC;
		}

		track.release = ISLA_SOUNDS_RELEASE_ID;

		const dataToApi = {
			...track,
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
			console.log('Error al obtener el track');
			return NextResponse.json(
				{ success: false, error: 'Error al obtener el track' },
				{ status: 404 }
			);
		}

		const trackToIslaSoundsRelease = {
			title: track.name,
			mixname: track.mix_name || '',
			resource: track.resource || '',
			external_id: track.external_id || 0,
		};

		if (!ISLA_SOUNDS_RELEASE_ID) {
			console.log('Error ISLA_SOUNDS_RELEASE_ID');
			return NextResponse.json(
				{ success: false, error: 'Error en el servidor' },
				{ status: 404 }
			);
		}
		let IS_DB = await Release.findOne({
			external_id: ISLA_SOUNDS_RELEASE_ID,
		});
		let CURRENT_DB = await Release.findOne({
			external_id: RELEASE_TO_MODIFY,
		});
		CURRENT_DB = CURRENT_DB.toObject();
		IS_DB = IS_DB.toObject();
		IS_DB.tracks.push(trackToIslaSoundsRelease);

		CURRENT_DB.tracks = CURRENT_DB.tracks.filter(
			(track: any) => track.external_id !== trackId
		);
		CURRENT_DB.tracks.forEach((track: any, index: number) => {
			track.order = index;
		});
		const updatedRelease = await Release.findOneAndUpdate(
			{ external_id: ISLA_SOUNDS_RELEASE_ID },
			{ $set: { tracks: IS_DB.tracks } },
			{ new: true }
		);

		const updatedReleaseCurrent = await Release.findOneAndUpdate(
			{ external_id: RELEASE_TO_MODIFY },
			{ $set: { tracks: CURRENT_DB.tracks } },
			{ new: true }
		);

		const IS_RELEASE_REQ = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/${ISLA_SOUNDS_RELEASE_ID}`,
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
		if (!IS_RELEASE_REQ.ok) {
			console.log('Error IS_RELEASE_REQ');
			return NextResponse.json(
				{ success: false, error: 'Error en el servidor' },
				{ status: 404 }
			);
		}

		const CURRENT_RELEASE_REQ = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/${RELEASE_TO_MODIFY}`,
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
		if (!CURRENT_RELEASE_REQ.ok) {
			console.log('Error CURRENT_RELEASE_REQ');
			return NextResponse.json(
				{ success: false, error: 'Error en el servidor' },
				{ status: 404 }
			);
		}
		const IS_RELEASE_DATA = await IS_RELEASE_REQ.json();
		IS_RELEASE_DATA.label = IS_RELEASE_DATA.label.id;
		try {
			if (IS_RELEASE_DATA.artwork.full_size) {
				const IS_PIC_DECODED = decodeURIComponent(
					new URL(IS_RELEASE_DATA.artwork.full_size).pathname.slice(1)
				);
				const IS_PIC = IS_PIC_DECODED.replace('media/', '');
				IS_RELEASE_DATA.artwork = IS_PIC;
			}
		} catch (error) {
			console.log('Error IS_PIC', error);
		}

		const CURRENT_RELEASE = await CURRENT_RELEASE_REQ.json();

		CURRENT_RELEASE.label = CURRENT_RELEASE.label.id;
		try {
			if (CURRENT_RELEASE.artwork.full_size) {
				const CR_PIC_DECODED = decodeURIComponent(
					new URL(CURRENT_RELEASE.artwork.full_size).pathname.slice(1)
				);
				const CR_PIC = CR_PIC_DECODED.replace('media/', '');
				CURRENT_RELEASE.artwork = CR_PIC;
			}
		} catch (error) {
			console.log('Error CR_PIC', error);
		}

		CURRENT_RELEASE.tracks = CURRENT_RELEASE.tracks.filter((track: any) => {
			return track.id !== trackId;
		});

		for (const [index, track] of CURRENT_RELEASE.tracks.entries()) {
			track.order = index;

			const resource_decoded = decodeURIComponent(
				new URL(track.resource).pathname.slice(1)
			);
			const resource = resource_decoded.replace('media/', '');
			track.resource = resource;

			if (track.dolby_atmos_resource && track.dolby_atmos_resource.length > 0) {
				const dolby_atmos_resource_decoded = decodeURIComponent(
					new URL(track.dolby_atmos_resource).pathname.slice(1)
				);
				const dolby_atmos_resource = dolby_atmos_resource_decoded.replace(
					'media/',
					''
				);
				track.dolby_atmos_resource = dolby_atmos_resource;
			}
			const trackToUpdate = await SingleTrack.findOne({
				external_id: track.id,
			});
			const trackToSend = {
				...trackToUpdate.toObject(),
				order: index,
			};
			const formData = new FormData();
			formData.append('data', JSON.stringify(trackToSend));
			const updatedTrack = await fetch(
				`http://localhost:3000/api/admin/updateSingle/${track.id}`,
				{
					method: 'PUT',
					headers: {
						Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken};refreshToken=${refresh_token}`,
					},
					body: formData,
				}
			);
			if (!updatedTrack.ok) {
				continue;
			}
		}

		for (const [index, track] of IS_RELEASE_DATA.tracks.entries()) {
			track.order = index;

			const resource_decoded = decodeURIComponent(
				new URL(track.resource).pathname.slice(1)
			);
			const resource = resource_decoded.replace('media/', '');
			track.resource = resource;
			if (track.dolby_atmos_resource) {
				const dolby_atmos_resource_decoded = decodeURIComponent(
					new URL(track.dolby_atmos_resource).pathname.slice(1)
				);
				const dolby_atmos_resource = dolby_atmos_resource_decoded.replace(
					'media/',
					''
				);
				track.dolby_atmos_resource = dolby_atmos_resource;
			}
			const trackToUpdate = await SingleTrack.findOne({
				external_id: track.id,
			});
			const trackToSend = {
				trackToUpdate: trackToUpdate.toObject(),
				order: index,
			};
			const formData = new FormData();
			formData.append('data', JSON.stringify(trackToSend));
			const updatedTrack = await fetch(
				`http://localhost:3000/api/admin/updateSingle/${track.id}`,
				{
					method: 'PUT',
					headers: {
						Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken};refreshToken=${refresh_token}`,
					},
					body: formData,
				}
			);
			if (!updatedTrack.ok) {
				continue;
			}
		}

		return NextResponse.json(
			{
				releaseId: ISLA_SOUNDS_RELEASE_ID.toString(),
				success: true,
				message: 'Track eliminado exitosamente',
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{
				success: false,
				message: 'Error eliminado track',
			},
			{ status: 500 }
		);
	}
}
