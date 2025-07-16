export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import Release from '@/models/ReleaseModel';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import nodeFetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { createLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
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
		const data = formData.get('data') as string;
		const dataJson = JSON.parse(data);
		let {
			name,
			label,
			label_name,
			publisher,
			publisher_name,
			genre,
			genre_name,
			subgenre,
			subgenre_name,
			artists,
			publisher_year,
			copyright_holder,
			copyright_holder_year,
			generate_ean,
			kind,
			catalogue_number,
			backcatalog,
			is_new_release,
			official_date,
			original_date,
			release_version,
			territory,
			available,
			youtube_declaration,
		} = dataJson;
		name = name.trim();
		label_name = label_name.trim();
		publisher_name = publisher_name.trim();
		copyright_holder = copyright_holder.trim();
		let picture_url = '';
		let picture_path = '';
		const temp_id = uuidv4().substring(0, 3);
		const label_id =
			verifiedPayload.role === 'sello'
				? verifiedPayload.externa_id
				: verifiedPayload.role === 'admin'
				? process.env.DEFAULT_LABEL_ID
				: label;
		let newRelease = {
			name,
			label: label_id,
			kind,
			language: 'ES',
			countries: [],
			tracks: [],
			is_new_release,
			dolby_atmos: false,
			backcatalog,
			auto_detect_language: true,
			generate_ean,
			genre: Number(genre),
			subgenre: Number(subgenre),
			youtube_declaration,
			release_version,
			publisher,
			publisher_year,
			catalogue_number: 'IS' + temp_id,
			copyright_holder,
			copyright_holder_year,
			official_date,
			original_date,
			territory,
		};
		const fileName = formData.get('fileName') as string;
		let tempFilePath: string | null = null;
		const chunk = formData.get('chunk') as Blob;
		const chunkIndex = parseInt(formData.get('chunkIndex') as string);
		const totalChunks = parseInt(formData.get('totalChunks') as string);

		if (isNaN(chunkIndex) || isNaN(totalChunks)) {
			return NextResponse.json(
				{ success: false, error: 'Datos de chunk inválidos' },
				{ status: 400 }
			);
		}
		const tempDir = path.join(process.cwd(), 'temp_uploads');
		await fs.mkdir(tempDir, { recursive: true });

		// Define el nombre del archivo temporal. ESTO DEBE ESTAR FUERA DEL IF.
		const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
		const tempFileName = `upload_${safeFileName}.tmp`;
		tempFilePath = path.join(tempDir, tempFileName);
		const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
		await fs.appendFile(tempFilePath, chunkBuffer);

		if (chunkIndex < totalChunks - 1) {
			return NextResponse.json({
				success: true,
				message: `Chunk ${chunkIndex} recibido`,
			});
		}
		if (!tempFilePath) {
			return NextResponse.json(
				{ success: false, error: 'Archivo de audio requerido' },
				{ status: 400 }
			);
		}
		const { size: fileSize } = await fs.stat(tempFilePath);
		const fileBuffer = await fs.readFile(tempFilePath);
		const metadata = await sharp(fileBuffer).metadata();
		const sizeInMB = fileSize / 1024 / 1024;

		if (
			metadata.width !== 3000 ||
			metadata.height !== 3000 ||
			(metadata.format !== 'jpeg' && metadata.format !== 'jpg') ||
			(metadata.space !== 'srgb' && metadata.space !== 'rgb') ||
			sizeInMB > 4
		) {
			await fs.unlink(tempFilePath);
			return NextResponse.json(
				{
					success: false,
					error: 'El archivo no tiene el formato o características soportadas',
				},
				{ status: 400 }
			);
		}
		const modifiedBuffer = await sharp(fileBuffer)
			.withMetadata({ density: 72 })
			.toBuffer();

		if (tempFilePath) {
			const fixedname = fileName.replaceAll(' ', '_');
			const safeName = fixedname;
			const uploadArtworkReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${safeName}&filetype=image/jpeg&upload_type=release.artwork`,
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
			if (!uploadArtworkReq.ok) {
				return NextResponse.json(
					{
						success: false,
						error: 'Error al obtener la URL de subida',
					},
					{ status: 400 }
				);
			}
			const uploadArtworkRes = await uploadArtworkReq.json();

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

			pictureFormData.append('file', modifiedBuffer, {
				filename: safeName,
				contentType: 'image/jpeg',
				knownLength: fileSize,
			});
			const uploadResponse = await nodeFetch(signedUrl, {
				method: 'POST',
				body: pictureFormData,
				headers: pictureFormData.getHeaders(),
			});

			picture_url = uploadResponse?.headers?.get('location') || '';
			const picture_path_decoded = decodeURIComponent(
				new URL(picture_url).pathname.slice(1)
			);
			picture_path = picture_path_decoded.replace('media/', '');
			if (!uploadResponse.ok) {
				return NextResponse.json(
					{
						success: false,
						error:
							uploadResponse.statusText ||
							'Error al subir el archivo de audio a S3',
					},
					{ status: uploadResponse.status || 400 }
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

		if (!releaseToApi.ok) {
			const apiRes = await releaseToApi.json();
			return NextResponse.json(
				{
					success: false,
					error: apiRes || 'Error al crear el release',
				},
				{ status: 400 }
			);
		}
		const apiRes = await releaseToApi.json();

		const getRelease = await fetch(
			`${process.env.MOVEMUSIC_API}/releases/${apiRes.id}`,
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
		if (!getRelease.ok) {
			const getReleaseRes = await getRelease.json();
			return NextResponse.json(
				{
					success: false,
					error: getReleaseRes || 'Error al obtener el release',
				},
				{ status: 400 }
			);
		}
		const getReleaseRes = await getRelease.json();

		await dbConnect();

		const cleanUrl = (url: string) => {
			return url.split('?')[0];
		};

		// Guardar en la base de datos
		const releaseToSave = {
			...newRelease,
			available: available,
			has_acr_alert: false,
			acr_alert: null,
			external_id: apiRes.id,
			picture: {
				full_size: getReleaseRes.artwork?.full_size
					? cleanUrl(getReleaseRes.artwork.full_size)
					: '/cd_cover.png',
				thumb_medium: getReleaseRes.artwork?.thumb_medium
					? cleanUrl(getReleaseRes.artwork.thumb_medium)
					: '/cd_cover.png',
				thumb_small: getReleaseRes.artwork?.thumb_small
					? cleanUrl(getReleaseRes.artwork.thumb_small)
					: '/cd_cover.png',
			},
			genre_name,
			subgenre_name,
			label_name,
			artists,
			publisher_name,
			release_user_declaration: null,
			qc_feedback: {},
			ddex_delivery_confirmations: null,
		};

		const savedRelease = await Release.create(releaseToSave);
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

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}

		return NextResponse.json({
			success: true,
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
