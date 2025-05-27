export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
	console.log('Create release request received');

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
			console.log('Token payload completo:', JSON.stringify(payload, null, 2));
			console.log('Datos del usuario:', {
				id: payload.id,
				name: payload.name,
				role: payload.role,
			});
		} catch (err) {
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		const formData = await req.formData();

		// Generar un ID temporal basado en timestamp
		const timestamp = Date.now();
		const random = Math.floor(Math.random() * 1000);

		// Parsear campos individuales
		const picture = formData.get('picture') as File | null;
		let pictureBuffer: Buffer | null = null;
		if (picture && picture instanceof File) {
			pictureBuffer = Buffer.from(await picture.arrayBuffer());
		}

		// Parsear campos complejos que vienen como stringified JSON
		const artistsRaw = formData.get('artists');
		const artists = artistsRaw ? JSON.parse(artistsRaw.toString()) : [];
		const countriesRaw = formData.get('countries');
		const countries = countriesRaw ? JSON.parse(countriesRaw.toString()) : [];

		// Parsear otros campos normales
		const name = formData.get('name') as string;
		const label = parseInt(formData.get('label') as string);
		const label_name = formData.get('label_name') as string;
		const kind = formData.get('kind') as string;
		const language = formData.get('language') as string;
		const release_version = formData.get('release_version') as string;
		const publisher = formData.get('publisher') as string;

		const publisher_name = formData.get('publisher_name') as string;
		console.log('Publisher data:', { publisher, publisher_name });
		const publisher_year = formData.get('publisher_year') as string;
		const copyright_holder = formData.get('copyright_holder') as string;

		const copyright_holder_year = formData.get(
			'copyright_holder_year'
		) as string;

		const official_date = formData.get('official_date') as string;
		const original_date = formData.get('original_date') as string;
		const territory = formData.get('territory') as string;

		// Parsear campos booleanos
		const dolby_atmos = formData.get('dolby_atmos') === 'true';
		const backcatalog = formData.get('backcatalog') === 'true';
		const auto_detect_language =
			formData.get('auto_detect_language') === 'true';
		const generate_ean = formData.get('generate_ean') === 'true';
		const youtube_declaration = formData.get('youtube_declaration') === 'true';
		let picture_url = '';
		let picture_path = '';
		// Parsear género y subgénero
		const genre = formData.get('genre') as string;
		const genre_name = formData.get('genre_name') as string;

		const subgenre = formData.get('subgenre') as string;
		const subgenre_name = formData.get('subgenre_name') as string;

		const temp_id = uuidv4();
		let newRelease = {
			name,
			label,
			kind,
			language,
			countries,
			tracks: [],
			dolby_atmos,
			backcatalog,
			auto_detect_language,
			generate_ean,
			genre: Number(genre),

			subgenre: Number(subgenre),
			youtube_declaration,
			release_version,
			publisher,

			publisher_year,
			catalogue_number: 'ISLASOUNDS' + temp_id,
			copyright_holder,
			copyright_holder_year,
			is_new_release: 1,
			official_date,
			original_date,
			territory,
		};

		if (picture) {
			console.log('ACTUALIZANDO TRAck');
			const uploadArtworkReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${picture.name}&filetype=${picture.type}&upload_type=release.artwork`,
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
			const uploadArtworkRes = await uploadArtworkReq.json();
			console.log('uploadArtworkRes', uploadArtworkRes);
			// Extraer la URL y los campos del objeto firmado
			const { url: signedUrl, fields: resFields } = uploadArtworkRes.signed_url;
			// Crear un objeto FormData y agregar los campos y el archivo
			const pictureFormData = new FormData();
			Object.entries(resFields).forEach(([key, value]) => {
				if (typeof value === 'string' || value instanceof Blob) {
					pictureFormData.append(key, value);
				} else {
					console.warn(
						`El valor de '${key}' no es un tipo válido para FormData:`,
						value
					);
				}
			});

			pictureFormData.append('file', picture);

			// Realizar la solicitud POST a la URL firmada
			const uploadResponse = await fetch(signedUrl, {
				method: 'POST',
				body: pictureFormData,
			});
			// console.log(uploadResponse?.headers?.get('location'));
			picture_url = uploadResponse?.headers?.get('location') || '';
			picture_path = decodeURIComponent(new URL(picture_url).pathname.slice(1));

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
					{ status: 500 }
				);
			}
		}

		const releaseToApiData = {
			...newRelease,
			artwork: picture_path,
			artists: artists.map((artist: any) => ({
				order: artist.order,
				artist: artist.artist,
				kind: artist.kind,
			})),
		};

		const releaseToApi = await fetch(`${process.env.MOVEMUSIC_API}/releases`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `JWT ${moveMusicAccessToken}`,
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
			},
			body: JSON.stringify(releaseToApiData),
		});
		const apiRes = await releaseToApi.json();
		if (!apiRes.id) {
			return NextResponse.json(
				{ success: false, error: apiRes || 'Error al crear el release' },
				{ status: 500 }
			);
		}
		console.log('apiRes', apiRes);
		await dbConnect();

		// Guardar en la base de datos
		const releaseToSave = {
			...newRelease,
			external_id: apiRes.id,
			picture: String(picture_url || '/cd_cover.png'),
			genre_name,
			subgenre_name,
			label_name,
			artists,
			publisher_name,
		};
		console.log('releaseToSave: ', releaseToSave);
		const savedRelease = await Release.create(releaseToSave);
		console.log('savedRelease: ', savedRelease);

		try {
			// Crear el log
			const logData = {
				action: 'CREATE' as const,
				entity: 'RELEASE' as const,
				entityId: savedRelease._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Release creado: ${name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};
			console.log('Log data a guardar:', JSON.stringify(logData, null, 2));
			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}

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
