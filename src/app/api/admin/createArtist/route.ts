import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';

export async function POST(req: NextRequest) {
	console.log('create single request received');

	try {
		await dbConnect();

		const formData = await req.formData();

		// Campos string
		const name = formData.get('name') as string;
		const mix_name = formData.get('mix_name') as string;
		const language = formData.get('language') as string;
		const vocals = formData.get('vocals') as string;
		const copyright_holder = formData.get('copyright_holder') as string;
		const copyright_holder_year = formData.get(
			'copyright_holder_year'
		) as string;
		const sample_start = formData.get('sample_start') as string;
		const ISRC = formData.get('ISRC') as string;
		const DA_ISRC = formData.get('DA_ISRC') as string;
		const track_length = formData.get('track_lenght') as string;
		const genre = formData.get('genre') as string;
		const subgenre = formData.get('subgenre') as string;
		const release_id = formData.get('release') as string;

		// Campos numéricos o booleanos
		const order = Number(formData.get('order') || 0);
		const label_share = Number(formData.get('label_share') || 0);
		const album_only = formData.get('album_only') === 'true';
		const explicit_content = formData.get('explicit_content') === 'true';
		const generate_isrc = formData.get('generate_isrc') === 'true';

		// Campos tipo archivo
		const resource = formData.get('resource') as File | null;
		const dolby_atmos_resource = formData.get(
			'dolby_atmos_resource'
		) as File | null;

		const resourceBuffer = resource
			? Buffer.from(await resource.arrayBuffer())
			: null;
		const dolbyBuffer = dolby_atmos_resource
			? Buffer.from(await dolby_atmos_resource.arrayBuffer())
			: null;

		// Arrays en string JSON
		const artists = JSON.parse((formData.get('artists') as string) || '[]');
		const publishers = JSON.parse(
			(formData.get('publishers') as string) || '[]'
		);
		const contributors = JSON.parse(
			(formData.get('contributors') as string) || '[]'
		);

		const trackData = {
			order,
			release: release_id,
			name,
			mix_name,
			language,
			vocals,
			artists,
			publishers,
			contributors,
			label_share,
			genre,
			subgenre,
			resource: resourceBuffer,
			dolby_atmos_resource: dolbyBuffer,
			copyright_holder,
			copyright_holder_year,
			album_only,
			sample_start,
			explicit_content,
			ISRC,
			generate_isrc,
			DA_ISRC,
			track_lenght: track_length,
		};

		const release = await Release.findById(release_id);

		if (!release) {
			return NextResponse.json(
				{ success: false, error: 'Release not found' },
				{ status: 404 }
			);
		}

		release.tracks.push(trackData);
		await release.save();

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
			{ message: 'Track created successfully and added to release' },
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
