import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SingleTrack from '@/models/SingleTrack';
import { Binary } from 'mongodb';
import { jwtVerify } from 'jose';

export async function POST(request: NextRequest) {
	console.log('crerateSingle');
	try {
		const token = request.cookies.get('loginToken')?.value;
		const moveMusicAccessToken = request.cookies.get('accessToken')?.value;

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
		await dbConnect();

		// Obtener el FormData de la solicitud
		const formData = await request.formData();

		console.log('Datos recibidos en createSingle:', {
			name: formData.get('name'),
			order: formData.get('order'),
			// No imprimir archivos binarios en los logs
			resource: formData.get('resource')
				? 'Archivo presente'
				: 'No hay archivo',
		});

		// Procesar los arrays JSON
		const artists = JSON.parse(formData.get('artists') as string);
		const publishers = JSON.parse(formData.get('publishers') as string);
		const contributors = JSON.parse(formData.get('contributors') as string);

		// Procesar el archivo de audio si existe
		let resourcePath = '';
		let resourceType = '';
		const resourceFile = formData.get('resource') as File;
		if (resourceFile && resourceFile instanceof File) {
			// Aquí podrías implementar la lógica para guardar el archivo
			// Por ejemplo, subirlo a un servicio de almacenamiento o guardarlo en el sistema de archivos
			// Por ahora, solo guardamos el nombre del archivo
			resourcePath = resourceFile.name;
			resourceType = resourceFile.type;
			console.log('Archivo de audio recibido:', resourceFile.name);
		}

		// Crear el objeto de datos para el modelo
		const singleData = {
			order: Number(formData.get('order')),
			release: formData.get('release'),
			name: formData.get('name'),
			mix_name: formData.get('mix_name'),
			language: formData.get('language'),
			vocals: formData.get('vocals'),
			artists: artists,
			publishers: publishers,
			contributors: contributors,
			label_share: formData.get('label_share'),
			genre: formData.get('genre'),
			subgenre: formData.get('subgenre'),
			resource: resourcePath,
			dolby_atmos_resource: formData.get('dolby_atmos_resource'),
			copyright_holder: formData.get('copyright_holder'),
			copyright_holder_year: formData.get('copyright_holder_year'),
			album_only: formData.get('album_only') === 'true',
			sample_start: formData.get('sample_start'),
			explicit_content: formData.get('explicit_content') === 'true',
			ISRC: formData.get('ISRC'),
			generate_isrc: formData.get('generate_isrc') === 'true',
			DA_ISRC: formData.get('DA_ISRC'),
			track_lenght: formData.get('track_lenght'),
		};
		console.log(singleData);

		// Si hay un archivo de audio, subirlo a MoveMusic
		if (resourceFile && resourceFile instanceof File) {
			// solicitar subida de track
			const uploadTrackReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${resourcePath}&filetype=${resourceType}&upload_type=track.audio`,
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
			const uploadTrackRes = await uploadTrackReq.json();

			// Extraer la URL y los campos del objeto firmado
			const { url: signedUrl, fields: trackFields } = uploadTrackRes.signed_url;

			// Crear un objeto FormData y agregar los campos y el archivo
			const trackFormData = new FormData();
			Object.entries(trackFields).forEach(([key, value]) => {
				if (typeof value === 'string' || value instanceof Blob) {
					trackFormData.append(key, value);
				} else {
					console.warn(
						`El valor de '${key}' no es un tipo válido para FormData:`,
						value
					);
				}
			});

			trackFormData.append('file', resourceFile); // Usar el archivo de audio

			// Realizar la solicitud POST a la URL firmada
			const uploadResponse = await fetch(signedUrl, {
				method: 'POST',
				body: trackFormData,
			});

			// Verificar si la subida fue exitosa
			if (!uploadResponse.ok) {
				console.error(
					'Error al subir el archivo de audio a S3:',
					await uploadResponse.text()
				);
				return NextResponse.json(
					{ success: false, error: 'Error al subir el archivo de audio a S3' },
					{ status: 500 }
				);
			}
			console.log(uploadResponse);
			// Obtener la URL pública del archivo subido
			const uploadedTrackUrl = uploadTrackRes.url;
			console.log(uploadedTrackUrl);
			const fileName = uploadedTrackUrl.split('/').pop();
			singleData.resource = fileName;
		}
		//enviar track a api externa
		const trackToApi = await fetch(`${process.env.MOVEMUSIC_API}/tracks/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
				Authorization: `JWT ${moveMusicAccessToken}`,
			},
			body: JSON.stringify(singleData),
		});

		const apiResponse = await trackToApi.json();
		console.log(apiResponse);
		// Crear el nuevo single en la base de datos
		// const newSingle = await SingleTrack.create(singleData);

		// console.log('Single creado exitosamente:', newSingle._id);

		return NextResponse.json(
			{
				success: true,
				message: 'Single creado exitosamente',
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error al crear el single:', error);
		return NextResponse.json(
			{
				success: false,
				message: 'Error al crear el single',
				error: error instanceof Error ? error.message : 'Error desconocido',
			},
			{ status: 500 }
		);
	}
}
