import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Contabilidad from '@/models/ContabilidadModel';
import { jwtVerify } from 'jose';
import fs from 'fs/promises';
import path from 'path';

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
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		const formData = await req.formData();

		// Extraer los campos del FormData
		let data = formData.get('data') as string;
		let file = formData.get('file');
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

		const extension = path.extname(fileName);

		if (
			extension.toLowerCase() !== '.csv' &&
			extension.toLowerCase() !== '.xlsx' &&
			extension.toLowerCase() !== '.xls' &&
			extension.toLowerCase() !== '.pdf' &&
			extension.toLowerCase() !== '.txt' &&
			extension.toLowerCase() !== '.json'
		) {
			await fs.unlink(tempFilePath);
			return NextResponse.json(
				{
					success: false,
					error:
						'Formato de archivo no soportado. Use: CSV, XLSX, XLS, PDF, TXT, JSON',
				},
				{ status: 400 }
			);
		}

		if (!tempFilePath) {
			return NextResponse.json(
				{ success: false, error: 'Archivo de audio requerido' },
				{ status: 400 }
			);
		}

		if (tempFilePath) {
			const fixedname = fileName.replaceAll(' ', '_');
			const extension = path.extname(fileName);
			const safeName = fixedname;

			try {
				// Conectar a la base de datos
				await dbConnect();

				// Leer el archivo completo y convertir a Base64
				const fileBuffer = await fs.readFile(tempFilePath);
				const fileContent = fileBuffer.toString('base64');

				// Parsear los datos JSON si existen
				let description = 'Archivo subido';
				if (data) {
					try {
						const parsedData = JSON.parse(data);
						description = parsedData.description || description;
					} catch (e) {
						console.log('No se pudo parsear data JSON');
					}
				}

				// Crear el documento en la base de datos
				const newFile = await Contabilidad.create({
					fileName: safeName,
					fileContent: fileContent,
					fileSize: fileBuffer.length,
					uploadedBy: verifiedPayload.id,
					description: description,
				});

				// Limpiar archivo temporal
				await fs.unlink(tempFilePath);

				return NextResponse.json({
					success: true,
					file: newFile,
				});
			} catch (dbError) {
				console.error('Error al guardar en la base de datos:', dbError);
				// Limpiar archivo temporal en caso de error
				if (tempFilePath) {
					try {
						await fs.unlink(tempFilePath);
					} catch (cleanupError) {
						console.error('Error al limpiar archivo temporal:', cleanupError);
					}
				}
				return NextResponse.json(
					{
						success: false,
						error: 'Error al guardar el archivo en la base de datos',
					},
					{ status: 500 }
				);
			}
		}

		return NextResponse.json({
			success: false,
			error: 'No se pudo procesar el archivo',
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
