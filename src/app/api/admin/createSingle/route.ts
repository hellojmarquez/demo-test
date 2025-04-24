import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel'; // Asegúrate de importar el modelo de Release

export async function POST(req: NextRequest) {
	console.log('create single request received');
	try {
		await dbConnect();

		// Obtener los datos como JSON
		const body = await req.json();

		// Asegúrate de que artists sea un array
		if (!Array.isArray(body.artists)) {
			if (typeof body.artists === 'string') {
				try {
					body.artists = JSON.parse(body.artists);
				} catch (e) {
					body.artists = [];
				}
			} else {
				body.artists = [];
			}
		}

		const release_id = body.release;

		const trackData = {
			order: body.order,
			release: body.release,
			name: body.name,
			mix_name: body.mix_name,
			language: body.language,
			vocals: body.vocals,
			artists: body.artists,
			publishers: Array.isArray(body.publishers) ? body.publishers : [],
			contributors: Array.isArray(body.contributors) ? body.contributors : [],
			label_share: body.label_share,
			genre: body.genre,
			subgenre: body.subgenre,
			resource: body.resource,
			dolby_atmos_resource: body.dolby_atmos_resource,
			copyright_holder: body.copyright_holder,
			copyright_holder_year: body.copyright_holder_year,
			album_only: !!body.album_only,
			sample_start: body.sample_start,
			explicit_content: !!body.explicit_content,
			ISRC: body.ISRC,
			generate_isrc: !!body.generate_isrc,
			DA_ISRC: body.DA_ISRC,
			track_lenght: body.track_lenght,
		};
		console.log(trackData);

		// Buscar el release por su ID
		const release = await Release.findById(release_id);

		if (!release) {
			return NextResponse.json(
				{ success: false, error: 'Release not found' },
				{ status: 404 }
			);
		}

		// Añadir trackData al array de tracks del Release
		release.tracks.push(trackData);

		// Guardar el Release con el nuevo track
		await release.save();

		// Obtener el token para la API externa
		const tokenRes = await fetch(
			`${process.env.MOVEMUSIC_API}/auth/obtain-token/`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify({
					username: process.env.MOVEMUSIC_USERNAME || '',
					password: process.env.MOVEMUSIC_PASSWORD || '',
				}),
			}
		);

		const tokenData = await tokenRes.json();

		if (!tokenData.access) {
			return NextResponse.json(
				{ success: false, error: 'No access token received' },
				{ status: 401 }
			);
		}

		// Enviar el track a la API externa
		const trackToApi = await fetch(`${process.env.MOVEMUSIC_API}/tracks`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
				Authorization: `JWT ${tokenData.access}`,
			},
			body: JSON.stringify(trackData),
		});
		const API_RESPONSE = await trackToApi.json();
		console.log(API_RESPONSE);

		return NextResponse.json(
			{
				message: 'Track created successfully and added to release',
			},
			{ status: 201 }
		);
	} catch (error: any) {
		return NextResponse.json(
			{
				error: error.message || 'Internal Server Error',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
