import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { jwtVerify } from 'jose';
import TempTrack from '@/models/TempTrack';
import { parseFile } from 'music-metadata';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
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
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}
		let trackData: Record<string, any> = {};
		let picture_url = '';
		let picture_path = '';
		const DEFAULT_RELEASE = Number(process.env.DEFAULT_RELEASE) || 0;
		const formData = await req.formData();
		const isTemporary = formData.get('isTemporary') === 'true';
		const sessionId = formData.get('sessionId') as string;

		// Validación más robusta
		if (isTemporary) {
			if (!sessionId || sessionId.trim() === '') {
				return NextResponse.json(
					{ success: false, error: 'SessionId requerido para modo temporal' },
					{ status: 400 }
				);
			}
		}
		let data = formData.get('data') as string | null;
		let tempFilePath: string | null = null;
		const fileName = formData.get('fileName') as string;
		const chunk = formData.get('chunk') as Blob;
		const chunkIndex = parseInt(formData.get('chunkIndex') as string);
		const totalChunks = parseInt(formData.get('totalChunks') as string);
		if (!data) {
			console.log('no se enviaron los datos correctamente');
			return NextResponse.json(
				{ success: false, error: 'Nose enviaron los datos correctamente' },
				{ status: 400 }
			);
		} else {
			trackData = JSON.parse(data);
		}

		if (isNaN(chunkIndex) || isNaN(totalChunks)) {
			console.log('datos de chunk inválidos');
			return NextResponse.json(
				{ success: false, error: 'Datos de chunk inválidos' },
				{ status: 400 }
			);
		}
		const releaseId =
			trackData.release && trackData.release !== 0
				? trackData.release
				: DEFAULT_RELEASE;
		trackData.release = releaseId;
		await dbConnect();

		const getRelease = await fetch(
			`http://localhost:3000/api/admin/getReleaseById/${trackData.release}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `loginToken=${token}; accessToken=${moveMusicAccessToken};refreshToken=${refresh_token}`,
				},
			}
		);

		if (!getRelease.ok) {
			console.log('error al obtener el release');
			const err = await getRelease.json();
			return NextResponse.json(
				{ success: false, error: err || 'Error al obtener el release' },
				{ status: 400 }
			);
		}
		const releaseData = await getRelease.json();
		const existingTrack = releaseData.data.tracks.find(
			(track: any) => track.title === trackData.name
		);
		if (existingTrack) {
			console.log('el track ya existe en el release');
			return NextResponse.json(
				{
					success: false,
					error: `El track ${existingTrack.title} ya existe en el release`,
				},
				{ status: 400 }
			);
		}

		const tempDir = path.join(process.cwd(), 'temp_uploads');
		await fs.mkdir(tempDir, { recursive: true });

		// Define el nombre del archivo temporal. ESTO DEBE ESTAR FUERA DEL IF.
		const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
		const tempFileName = `upload_${trackData.id}_${safeFileName}.tmp`;
		tempFilePath = path.join(tempDir, tempFileName);
		const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
		await fs.appendFile(tempFilePath, chunkBuffer);

		if (chunkIndex < totalChunks - 1) {
			return NextResponse.json({
				success: true,
				message: `Chunk ${chunkIndex} recibido`,
			});
		}

		const extension = path.extname(fileName);

		if (!tempFilePath) {
			console.log('no se encontro el archivo');
			return NextResponse.json(
				{ success: false, error: 'Archivo de audio requerido' },
				{ status: 400 }
			);
		}
		const { size } = await fs.stat(tempFilePath);
		const sizeInMB = size / 1024 / 1024;
		const metadata = await parseFile(tempFilePath);
		const { sampleRate, bitsPerSample } = metadata.format;
		if (
			(extension.toLowerCase() !== '.wav' &&
				extension.toLowerCase() !== '.wave') ||
			sampleRate !== 44100 ||
			bitsPerSample !== 16 ||
			sizeInMB > 159
		) {
			console.log('el archivo no tiene el formato correcto');
			await fs.unlink(tempFilePath);
			return NextResponse.json(
				{ success: false, error: 'EL archivo no tiene el formato correcto' },
				{ status: 400 }
			);
		}
		if (isTemporary) {
			try {
				// Guardar en TempTrack en lugar de enviar a API externa
				const tempTrack = await TempTrack.create({
					sessionId,
					trackData: {
						...trackData,
						picture_path: null,
						picture_url: null,
					},
					tempFilePath,
					createdAt: new Date(),
				});

				return NextResponse.json({
					success: true,
					tempId: tempTrack._id,
					data: tempTrack.trackData,
					message: 'Track procesado temporalmente',
				});
			} catch (tempError) {
				console.error('Error al crear track temporal:', tempError);

				// Limpiar archivo temporal si existe
				if (tempFilePath) {
					try {
						await fs.unlink(tempFilePath);
					} catch (cleanupError) {
						console.error('Error al limpiar archivo temporal:', cleanupError);
					}
				}

				return NextResponse.json(
					{ success: false, error: 'Error al procesar track temporalmente' },
					{ status: 500 }
				);
			}
		}
	} catch (error: any) {
		console.log('error: ', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
