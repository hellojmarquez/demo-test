import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { jwtVerify } from 'jose';
<<<<<<< HEAD
import TempTrack from '@/models/TempTrack';
import { parseFile } from 'music-metadata';
import fs from 'fs/promises';
import path from 'path';
=======
import { createLog } from '@/lib/logger';
import Release from '@/models/ReleaseModel';
const chunksInMemory: { [fileName: string]: Buffer[] } = {};
>>>>>>> e7bdbe652e2253140056a6871a5072c4ea59032d

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
<<<<<<< HEAD
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
=======
		let file: File | null = null;
		let picture_url = '';
		let picture_path = '';
		const formData = await req.formData();
		let data = formData.get('data') as string | null;
		const fileName = formData.get('fileName') as string;
		const chunk = formData.get('chunk') as Blob;
		const chunkIndex = parseInt(formData.get('chunkIndex') as string);
		const totalChunks = parseInt(formData.get('totalChunks') as string);

		if (isNaN(chunkIndex) || isNaN(totalChunks)) {
			return NextResponse.json(
>>>>>>> e7bdbe652e2253140056a6871a5072c4ea59032d
				{ success: false, error: 'Datos de chunk inválidos' },
				{ status: 400 }
			);
		}
<<<<<<< HEAD
		const releaseId =
			trackData.release && trackData.release !== 0
				? trackData.release
				: DEFAULT_RELEASE;
		trackData.release = releaseId;
		await dbConnect();
=======
		if (!data) {
			return NextResponse.json(
				{ success: false, error: 'Nose enviaron los datos correctamente' },
				{ status: 400 }
			);
		} else {
			trackData = JSON.parse(data);
		}
		// Convertir chunk a Buffer y almacenar en memoria
		const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

		// Inicializar array si no existe
		if (!chunksInMemory[fileName]) {
			chunksInMemory[fileName] = [];
		}

		// Almacenar chunk en la posición correcta
		chunksInMemory[fileName][chunkIndex] = chunkBuffer;
		

		// Si es el último chunk, combinar todos los chunks
		if (chunkIndex === totalChunks - 1) {
		
			const missingChunks = [];
			for (let i = 0; i < totalChunks; i++) {
				if (!chunksInMemory[fileName][i]) {
					missingChunks.push(i);
				}
			}

			if (missingChunks.length > 0) {
			
				return NextResponse.json(
					{
						success: false,
						error: `Error al subir el archivo`,
					},
					{ status: 400 }
				);
			}

			// Continuar con la lógica del archivo completo
			const completeFile = Buffer.concat(chunksInMemory[fileName]);
			// O crear un File object
			file = new File([completeFile], fileName, {
				type: 'audio/wav', // o el tipo que corresponda
			});

			// Limpiar memoria
			delete chunksInMemory[fileName];
		} else {
			
			return NextResponse.json({ success: true, chunkIndex });
		}

		await dbConnect();
		if (!file) {
			return NextResponse.json(
				{ success: false, error: 'Archivo de audio requerido' },
				{ status: 400 }
			);
		}
		if (file) {
			let fixedFileName = '';
			if (file.name) {
				fixedFileName = file.name.replaceAll(' ', '');
			}
			const uploadTrackReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${fixedFileName}&filetype=${file.type}&upload_type=track.audio`,
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

			trackFormData.append('file', file);

			// Realizar la solicitud POST a la URL firmada
			const uploadResponse = await fetch(signedUrl, {
				method: 'POST',
				body: trackFormData,
			});

			picture_url = uploadResponse.headers?.get('location') || '';
			const picture_path_decoded = decodeURIComponent(
				new URL(picture_url).pathname.slice(1)
			);
			picture_path = picture_path_decoded.replace('media/', '');

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
					{ status: 401 }
				);
			}
		}
>>>>>>> e7bdbe652e2253140056a6871a5072c4ea59032d

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

<<<<<<< HEAD
		if (!tempFilePath) {
			console.log('no se encontro el archivo');
=======
		const trackReq = await fetch(`${process.env.MOVEMUSIC_API}/tracks/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `JWT ${moveMusicAccessToken}`,
				'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
				Referer: process.env.MOVEMUSIC_REFERER || '',
			},
			body: JSON.stringify(dataToapi),
		});

		const trackRes = await trackReq.json();
	
		if (!trackReq.ok) {
>>>>>>> e7bdbe652e2253140056a6871a5072c4ea59032d
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
