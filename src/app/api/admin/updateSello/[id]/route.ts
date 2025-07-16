import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User, Sello } from '@/models/UserModel';
import { jwtVerify } from 'jose';
import { encryptPassword } from '@/utils/auth';
import { createLog } from '@/lib/logger';
import AccountRelationship from '@/models/AccountRelationshipModel';
import SelloArtistaContrato from '@/models/AsignacionModel';
import FormData from 'form-data';
import nodeFetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

interface SubAccount {
	subAccountId: string;
	status: string;
	role: string;
}

// Definir la interfaz para la asignación
interface Asignacion {
	artista_id: {
		external_id: number;
		name: string;
	};
	fecha_inicio: string;
	fecha_fin?: string;
	tipo_contrato: 'exclusivo' | 'no_exclusivo';
	porcentaje_distribucion: number;
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

		const { id } = params;

		await dbConnect();
		// Obtener el sello actual para comparar cambios
		const currentSello = await User.findOne({ external_id: id });

		if (!currentSello) {
			return NextResponse.json(
				{ error: 'Sello no encontrado' },
				{ status: 404 }
			);
		}

		const formD = await req.formData();

		let data: any = {};
		data = formD.get('data') as string;
		data = JSON.parse(data);

		const fileName = formD.get('fileName') as string;
		const chunk = formD.get('chunk') as Blob;
		const chunkIndex = parseInt(formD.get('chunkIndex') as string);
		const totalChunks = parseInt(formD.get('totalChunks') as string);
		const fileType = formD.get('fileType') as string;
		let tempFilePath: string | null = null;

		let tempDir: string | null = null;
		let safeFileName: string | null = null;
		let picture_url = '';
		let picture_path = '';

		if (!data) {
			console.log('No se recibieron datos para actualizar');
			return NextResponse.json(
				{ error: 'No se recibieron datos para actualizar' },
				{ status: 400 }
			);
		}

		let updateData: any = {
			name: data.name,
			primary_genre: data.primary_genre,
			year: parseInt(data.year as string),
			catalog_num: parseInt(data.catalog_num as string),
			logo: '',
		};

		// Manejar la imagen si se proporciona una nueva
		if (fileName && fileName.length > 0) {
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

			const { size: fileSize } = await fs.stat(tempFilePath);
			const fileBuffer = await fs.readFile(tempFilePath);
			const metadata = await sharp(fileBuffer).metadata();
			const sizeInMB = fileSize / 1024 / 1024;

			if (
				metadata.width !== 1000 ||
				metadata.height !== 1000 ||
				(metadata.format !== 'jpeg' && metadata.format !== 'jpg') ||
				(metadata.space !== 'srgb' && metadata.space !== 'rgb')
			) {
				await fs.unlink(tempFilePath);
				return NextResponse.json(
					{
						success: false,
						error: 'La imagen no tiene el formato o características soportadas',
					},
					{ status: 400 }
				);
			}
			if (sizeInMB > 4) {
				await fs.unlink(tempFilePath);
				return NextResponse.json(
					{
						success: false,
						error: 'La imagen es debe pesar máximo 4MB',
					},
					{ status: 400 }
				);
			}
			const fixedname = fileName.replaceAll(' ', '_');

			const safeName = fixedname;
			const uploadMediaReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${safeName}&filetype=image/jpeg&upload_type=label.logo`,
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
			if (!uploadMediaReq) {
				console.log('Error al obtener la url firmada');
				return NextResponse.json(
					{ error: 'Error al obtener la url firmada' },
					{ status: 400 }
				);
			}
			const uploadMediaRes = await uploadMediaReq.json();
			const { url: signedUrl, fields: mediaFields } = uploadMediaRes.signed_url;
			const mediaFormData = new FormData();
			Object.entries(mediaFields).forEach(([key, value]) => {
				if (typeof value === 'string' || value instanceof Blob) {
					mediaFormData.append(key, value);
				}
			});

			mediaFormData.append('file', fileBuffer, {
				filename: safeName,
				contentType: 'image/jpeg',
				knownLength: fileSize,
			});
			const uploadResponse = await nodeFetch(signedUrl, {
				method: 'POST',
				body: mediaFormData,
				headers: mediaFormData.getHeaders(),
			});

			await fs.unlink(tempFilePath);
			picture_url = uploadResponse?.headers?.get('location') || '';
			const picture_path_decoded = decodeURIComponent(
				new URL(picture_url).pathname.slice(1)
			);
			picture_path = picture_path_decoded.replace('media/', '');
			updateData.logo = picture_path;
		}

		if (picture_path && picture_path.length > 0) {
			updateData.logo = picture_path;
		} else {
			const decoded_logo = decodeURIComponent(
				new URL(currentSello.picture).pathname.slice(1)
			);
			updateData.logo = decoded_logo.replace('media/', '');
		}

		const externalApiRes = await fetch(
			`${process.env.MOVEMUSIC_API}/labels/${id}`,
			{
				method: 'PUT',
				body: JSON.stringify(updateData),
				headers: {
					'Content-Type': 'application/json',
					Authorization: `JWT ${moveMusicAccessToken}`,
					'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
					Referer: process.env.MOVEMUSIC_REFERER || '',
				},
			}
		);

		if (!externalApiRes.ok) {
			const externalApiResJson = await externalApiRes.json();

			return NextResponse.json(
				{
					success: false,
					error:
						externalApiResJson ||
						'Ha habido un error, estamos trabajando en ello',
				},
				{ status: 400 }
			);
		}

		delete updateData.logo;

		let dataToBBDD = {
			...updateData,
			email: data.email,
			role: data.role,
			external_id: data.external_id,
			isMainAccount: true,
			status: data.status,
			picture: picture_url.length > 0 ? picture_url : currentSello.picture,
		};
		if (data.password) {
			dataToBBDD.password = await encryptPassword(data.password);
		}

		// Actualizar el sello
		const updatedSello = await Sello.findOneAndUpdate(
			{ external_id: data.external_id },
			{
				$set: {
					...dataToBBDD,
					primary_genre: data.primary_genre,
				},
			},
			{
				new: true,
				runValidators: true,
			}
		).select('-password');
		if (!updatedSello) {
			return NextResponse.json(
				{ error: 'Error al actualizar el sello' },
				{ status: 500 }
			);
		}
		// Después de actualizar el sello y antes de manejar las relaciones de cuentas
		try {
			// Si hay asignaciones, procesarlas
			if (data.asignaciones) {
				const asignaciones = data.asignaciones;

				// Obtener las asignaciones existentes
				const existingAsignaciones = await SelloArtistaContrato.find({
					sello_id: updatedSello._id,
					estado: 'activo',
				});
				// Crear un mapa de las asignaciones existentes
				const existingMap = new Map(
					existingAsignaciones.map(asig => [asig.artista_id.toString(), asig])
				);

				// Crear un mapa de las nuevas asignaciones
				const newMap = new Map<number, Asignacion>(
					asignaciones.map((asig: Asignacion) => [
						Number(asig.artista_id.external_id),
						asig,
					])
				);

				// Eliminar asignaciones que ya no existen
				if (data.removedAsignaciones) {
					const removedAsignaciones = data.removedAsignaciones;
					if (data.removedAsignaciones.length > 0) {
						removedAsignaciones.forEach(async (id: string) => {
							await SelloArtistaContrato.findByIdAndUpdate(id, {
								estado: 'inactivo',
							});
						});
					}
				}

				Array.from(existingMap.entries()).forEach(
					async ([artistaId, asignacion]) => {
						if (!newMap.has(artistaId)) {
							await SelloArtistaContrato.findByIdAndUpdate(asignacion._id, {
								estado: 'inactivo',
							});
						}
					}
				);

				// Crear nuevas asignaciones
				Array.from(newMap.entries()).forEach(
					async ([artistaId, asignacion]) => {
						if (!existingMap.has(artistaId)) {
							// Verificar si el artista ya tiene un contrato activo con otro sello
							const contratoExistente = await SelloArtistaContrato.findOne({
								'artista_id.external_id': Number(artistaId),
								estado: 'activo',
								sello_id: { $ne: updatedSello._id },
							});

							if (contratoExistente) {
								throw new Error(
									`El artista ${asignacion.artista_id.name} ya tiene un contrato activo con otro sello`
								);
							}

							// Crear nueva asignación
							await SelloArtistaContrato.create({
								sello_id: updatedSello._id,
								artista_id: {
									external_id: Number(artistaId),
									name: asignacion.artista_id.name,
								},
								fecha_inicio: new Date(asignacion.fecha_inicio),
								fecha_fin: asignacion.fecha_fin
									? new Date(asignacion.fecha_fin)
									: null,
								tipo_contrato: asignacion.tipo_contrato,
								porcentaje_distribucion: asignacion.porcentaje_distribucion,
								estado: 'activo',
							});
						}
					}
				);
			}
		} catch (asignacionError) {
			console.error('Error al manejar las asignaciones:', asignacionError);
			return NextResponse.json(
				{
					success: false,
					error:
						asignacionError instanceof Error
							? asignacionError.message
							: 'Error al procesar las asignaciones',
				},
				{ status: 400 }
			);
		}
		// Manejar las relaciones de cuentas
		try {
			// Si hay subcuentas, procesarlas
			if (data.subAccounts) {
				const subAccounts = data.subAccounts as SubAccount[];

				// Obtener las relaciones existentes
				const existingRelationships = await AccountRelationship.find({
					mainAccountId: updatedSello._id,
				});

				// Crear un mapa de las relaciones existentes para facilitar la búsqueda
				const existingMap = new Map(
					existingRelationships.map(rel => [rel.subAccountId.toString(), rel])
				);

				// Crear un mapa de las nuevas relaciones
				const newMap = new Map(subAccounts.map(sub => [sub.subAccountId, sub]));

				// Eliminar relaciones que ya no existen
				Array.from(existingMap.entries()).forEach(([subAccountId, rel]) => {
					if (!newMap.has(subAccountId)) {
						AccountRelationship.findByIdAndDelete(rel._id);
					}
				});

				// Crear o actualizar relaciones nuevas
				Array.from(newMap.entries()).forEach(([subAccountId, subAccount]) => {
					if (!existingMap.has(subAccountId)) {
						// Crear nueva relación
						AccountRelationship.create({
							mainAccountId: updatedSello._id,
							subAccountId: subAccount.subAccountId,
							role: subAccount.role,
							status: 'activo',
						});
					}
				});
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
				entityId: updatedSello._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Sello actualizado: ${updatedSello.name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json({
			success: true,
			data: updatedSello,
		});
	} catch (error: any) {
		console.error('Error updating sello:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
