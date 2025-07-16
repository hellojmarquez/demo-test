export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Artista } from '@/models/UserModel';
import AccountRelationship from '@/models/AccountRelationshipModel';
import { encryptPassword } from '@/utils/auth';
import nodeFetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { createLog } from '@/lib/logger';

interface SubAccount {
	subAccountId: string;
	status: string;
	role: string;
}

interface UpdateArtistBody {
	name: string;
	email: string;
	password?: string;
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
	role: string;
	picture?: string;
	subAccounts?: SubAccount[];
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
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
		const formD = await req.formData();
		const fileName = formD.get('fileName') as string;
		const data = JSON.parse(formD.get('data') as string);
		const chunk = formD.get('chunk') as Blob;
		const chunkIndex = parseInt(formD.get('chunkIndex') as string);
		const totalChunks = parseInt(formD.get('totalChunks') as string);
		const fileType = formD.get('fileType') as string;
		let tempFilePath: string | null = null;
		let picture_url = '';
		if (!data) {
			return NextResponse.json(
				{ error: 'No se recibieron datos para actualizar' },
				{ status: 400 }
			);
		}
		const {
			name,
			email,
			role,
			_id,
			external_id,
			status,
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
			password,
			mainAccountId,
			subAccounts,
			relationshipStatus,
		} = data;
		const curerentUser = await Artista.findOne({ external_id: external_id });
		if (!curerentUser) {
			return NextResponse.json(
				{ success: false, error: 'Artista no encontrado' },
				{ status: 404 }
			);
		}

		if (fileName && fileName.length > 0) {
			if (isNaN(chunkIndex) || isNaN(totalChunks)) {
				return NextResponse.json(
					{ success: false, error: 'Datos de chunk inválidos' },
					{ status: 400 }
				);
			}
			const tempDir = path.join(process.cwd(), 'temp_uploads');
			await fs.mkdir(tempDir, { recursive: true });

			// Define el nombre del archivo temporal
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
				extension.toLowerCase() !== '.jpg' &&
				extension.toLowerCase() !== '.jpeg' &&
				extension.toLowerCase() !== '.png'
			) {
				await fs.unlink(tempFilePath);
				return NextResponse.json(
					{ success: false, error: 'La imagen debe ser: jpg o Png' },
					{ status: 400 }
				);
			}

			try {
				// Convertir a base64 cuando el archivo está completo
				const fileBuffer = await fs.readFile(tempFilePath);
				picture_url = fileBuffer.toString('base64');
			} catch (fileError) {
				console.error('Error al procesar el archivo:', fileError);
				// await fs.unlink(tempFilePath);
				return NextResponse.json(
					{ success: false, error: 'Error al procesar el archivo' },
					{ status: 500 }
				);
			} finally {
				// Limpiar archivo temporal
				try {
					await fs.unlink(tempFilePath);
				} catch (cleanupError) {
					console.error('Error al limpiar archivo temporal:', cleanupError);
				}
			}
		}
		const artistToApi = {
			name,
			email,
			amazon_music_identifier,
			apple_identifier,
			deezer_identifier,
			spotify_identifier,
		};
		const artistReq = await fetch(
			`${process.env.MOVEMUSIC_API}/artists/${params.id}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
				body: JSON.stringify(artistToApi),
			}
		);

		if (!artistReq.ok) {
			const artistRes = await artistReq.json();

			return NextResponse.json(
				{
					success: false,
					error: artistRes || 'error al actualizar el artista',
				},
				{ status: artistReq.status }
			);
		}
		const artistRes = await artistReq.json();
		// Conectar a la base de datos local
		await dbConnect();

		// Preparar el objeto de actualización
		let updateData = {
			...artistToApi,
			picture:
				picture_url && picture_url.length > 0
					? picture_url
					: curerentUser.picture,
			role,
			status,
			external_id,
			...(password &&
				password.length > 0 && { password: await encryptPassword(password) }),
		};

		// Actualizar el usuario en la base de datos local
		const updatedArtist = await Artista.findOneAndUpdate(
			{ external_id: params.id },
			{ $set: updateData },
			{ new: true, runValidators: true }
		).select('-password');

		if (!updatedArtist) {
			return NextResponse.json(
				{ success: false, error: 'Artista no encontrado' },
				{ status: 404 }
			);
		}

		// Manejar las relaciones de cuentas
		try {
			// Si hay subcuentas, procesarlas
			if (subAccounts) {
				const subAccos = subAccounts as SubAccount[];

				// Eliminar relaciones existentes para este mainAccount
				await AccountRelationship.deleteMany({
					mainAccount: updatedArtist._id,
				});

				// Crear nuevas relaciones
				if (subAccos.length > 0) {
					const relationships = subAccounts.map((subAccount: any) => ({
						mainAccountId: updatedArtist._id,
						subAccountId: subAccount.subAccountId,
						role: subAccount.role,
						status: 'activo',
					}));

					// Insertar todas las relaciones
					await AccountRelationship.insertMany(relationships);
				}
			}
		} catch (relationshipError) {
			console.error('Error al manejar las relaciones:', relationshipError);
			// No interrumpimos el flujo si falla el manejo de relaciones
		}

		try {
			// Crear el log
			const logData = {
				action: 'UPDATE' as const,
				entity: 'USER' as const,
				entityId: updatedArtist._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Artista actualizado: ${updateData.name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json({
			success: true,
			artist: updatedArtist,
		});
	} catch (error) {
		console.error('Error updating artist:', error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Internal Server Error',
			},
			{ status: 500 }
		);
	}
}
