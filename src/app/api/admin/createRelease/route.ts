import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { jwtVerify } from 'jose';
import Release from '@/models/ReleaseModel';

export async function POST(req: NextRequest) {
	console.log('Create release request received');

	try {
		const token = req.cookies.get('loginToken')?.value;
		const moveMusicAccessToken = req.cookies.get('accessToken')?.value;

		if (!token) {
			return NextResponse.json(
				{ success: false, error: 'Not authenticated' },
				{ status: 401 }
			);
		}

		try {
			await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		await dbConnect();

		const formData = await req.formData();

		// Parsear campos individuales
		const picture = formData.get('avatar') as File;
		const pictureBuffer = Buffer.from(await picture.arrayBuffer());
		const auto_detect_language = formData.get('auto_detect_language') === 'on';
		const generate_ean = formData.get('generate_ean') === 'on';
		const backcatalog = formData.get('backcatalog') === 'on';
		const youtube_declaration = formData.get('youtube_declaration') === 'on';
		const dolby_atmos = formData.get('dolby_atmos') === 'on';

		// Parsear campos complejos que vienen como stringified JSON
		const artistsRaw = formData.get('artists');
		const artists = artistsRaw ? JSON.parse(artistsRaw.toString()) : [];

		const tracks = JSON.parse(formData.get('tracks') as string);
		const countries = JSON.parse(formData.get('countries') as string);

		// Parsear otros campos normales
		const name = formData.get('name') as string;
		const kind = formData.get('kind') as string;
		const label = formData.get('label') as string;
		const language = formData.get('language') as string;

		// Combinar todo en un solo objeto para guardar o retornar
		const releaseData = {
			picture: pictureBuffer,
			auto_detect_language,
			generate_ean,
			backcatalog,
			youtube_declaration,
			dolby_atmos,
			artists,
			tracks,
			countries,
			name,
			kind,
			label,
			language,
		};

		console.log('Parsed release:', releaseData);
		const newRelease = new Release(releaseData);
		await newRelease.save();
		return NextResponse.json(
			{
				success: true,
				message: 'Release created successfully',
				data: newRelease,
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error creating release:', error);
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
