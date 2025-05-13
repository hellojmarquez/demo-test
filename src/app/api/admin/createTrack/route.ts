import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Release from '@/models/ReleaseModel';
import SingleTrack from '@/models/SingleTrack';

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const tracks = formData.getAll('tracks[]') as string[];
		const files = formData.getAll('files[]') as File[];
		const titles = formData.getAll('titles[]') as string[];
		const mixNames = formData.getAll('mixNames[]') as string[];

		if (!tracks.length || !files.length) {
			return NextResponse.json(
				{ success: false, message: 'No se proporcionaron tracks' },
				{ status: 400 }
			);
		}

		// Validar que todos los archivos sean WAV
		for (const file of files) {
			if (file.type !== 'audio/wav') {
				return NextResponse.json(
					{ success: false, message: 'Solo se permiten archivos WAV' },
					{ status: 400 }
				);
			}
		}

		// Conectar a la base de datos
		const mongoose = await connectToDatabase();
		if (!mongoose.connection.db) {
			throw new Error('No se pudo conectar a la base de datos');
		}

		// Obtener la URL base del servidor
		const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
		const host = request.headers.get('host') || 'localhost:3000';
		const baseUrl = `${protocol}://${host}`;

		// Crear los tracks secuencialmente
		const trackIds = [];
		for (let i = 0; i < tracks.length; i++) {
			const trackFormData = new FormData();

			// Crear el objeto de datos para el track
			const trackData = {
				order: i + 1,
				name: titles[i]?.trim() || `Track ${i + 1}`,
				mix_name: mixNames[i]?.trim() || '',
				language: 'AB',
				vocals: 'ZXX',
				artists: [
					{
						id: 22310,
						order: 2147483647,
						artist: 1541,
						kind: 'main',
						name: 'Jhon Doe',
					},
				],
				publishers: [
					{
						order: 3,
						publisher: 70,
						author: 'Juan Cisneros',
					},
				],
				contributors: [
					{
						id: 555,
						order: 3,
						contributor: 1046,
						role: 2,
						name: 'Jhon Doe',
					},
				],
				label_share: '',
				genre: { id: 3, name: 'Alternative' },
				subgenre: {
					id: 90,
					name: 'Alternative',
				},
				dolby_atmos_resource: '',
				copyright_holder: 'ISLA sOUNDS',
				copyright_holder_year: '2025',
				album_only: true,
				sample_start: '',
				explicit_content: true,
				ISRC: '',
				generate_isrc: true,
				DA_ISRC: '',
				track_lenght: '',
			};

			// Agregar los datos como JSON string
			trackFormData.append('data', JSON.stringify(trackData));
			trackFormData.append('file', files[i]);

			const trackResponse = await fetch(`${baseUrl}/api/admin/createSingle`, {
				method: 'POST',
				body: trackFormData,
				credentials: 'include',
				headers: {
					Cookie: request.headers.get('cookie') || '',
				},
			});

			if (!trackResponse.ok) {
				const error = await trackResponse.json();
				console.error('Error al crear track:', error);
				return NextResponse.json(
					{
						success: false,
						message: error.message || 'Error al crear el track',
					},
					{ status: trackResponse.status }
				);
			}

			const trackResult = await trackResponse.json();

			if (!trackResult.success) {
				return NextResponse.json(
					{
						success: false,
						message: trackResult.error || 'Error al crear el track',
					},
					{ status: 400 }
				);
			}

			// Usar external_id para la relación
			trackIds.push({
				id: trackResult.data.external_id,
				resource: trackResult.data.resource,
			});
		}

		return NextResponse.json({
			success: true,
			message: 'Tracks creados exitosamente',
			tracks: trackIds,
		});
	} catch (error: any) {
		console.error('Error al crear los tracks:', error);
		return NextResponse.json(
			{
				success: false,
				message: error.message || 'Error al crear los tracks',
			},
			{ status: 500 }
		);
	}
}
