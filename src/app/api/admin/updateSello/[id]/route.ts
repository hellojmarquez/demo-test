import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User, Sello } from '@/models/UserModel';
import { jwtVerify } from 'jose';
import { encryptPassword } from '@/utils/auth';
import { createLog } from '@/lib/logger';
import AccountRelationship from '@/models/AccountRelationshipModel';
import SelloArtistaContrato from '@/models/AsignacionModel';

interface SubAccount {
	subAccountId: string;
	status: string;
	role: string;
}

// Definir la interfaz para la asignación
interface Asignacion {
	artista_id: {
		_id: string;
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
	console.log('updateSello');
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

		let data: any;
		let file: File | null = null;

		let picture_url = '';
		let picture_path = '';

		// Determinar si la solicitud es FormData o JSON
		const contentType = req.headers.get('content-type') || '';
		if (contentType.includes('multipart/form-data')) {
			const formData = await req.formData();
			file = formData.get('file') as File;

			// Extraer todos los campos del FormData
			data = {
				name: formData.get('name'),
				email: formData.get('email'),
				password: formData.get('password'),
				role: formData.get('role'),
				external_id: Number(formData.get('external_id')),
				_id: formData.get('_id'),
				status: formData.get('status'),
				catalog_num: formData.get('catalog_num'),
				year: formData.get('year'),
				exclusivity: formData.get('exclusivity'),
				primary_genre: formData.get('primary_genre'),
				subAccounts: formData.get('subAccounts'),
				asignaciones: formData.get('asignaciones'),
			};
		} else if (contentType.includes('application/json')) {
			data = await req.json();
		}

		if (!data) {
			return NextResponse.json(
				{ error: 'No se recibieron datos para actualizar' },
				{ status: 400 }
			);
		}

		// Preparar los datos para la actualización
		let updateData: any = {
			name: data.name,
			primary_genre: data.primary_genre,
			year: parseInt(data.year),
			catalog_num: parseInt(data.catalog_num),
			status: data.status,
			logo: '',
		};
		console.log('data', data);
		// Manejar la imagen si se proporciona una nueva
		if (file) {
			const uploadMediaReq = await fetch(
				`${process.env.MOVEMUSIC_API}/obtain-signed-url-for-upload/?filename=${file.name}&filetype=${file.type}&upload_type=label.logo`,
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
			const uploadMediaRes = await uploadMediaReq.json();
			const { url: signedUrl, fields: mediaFields } = uploadMediaRes.signed_url;
			const mediaFormData = new FormData();
			Object.entries(mediaFields).forEach(([key, value]) => {
				if (typeof value === 'string' || value instanceof Blob) {
					mediaFormData.append(key, value);
				}
			});
			mediaFormData.append('file', file);
			const uploadResponse = await fetch(signedUrl, {
				method: 'POST',
				body: mediaFormData,
			});
			picture_url = uploadResponse?.headers?.get('location') || '';
			const picture_path_decoded = decodeURIComponent(
				new URL(picture_url).pathname.slice(1)
			);
			picture_path = picture_path_decoded.replace('media/', '');
			updateData.logo = picture_path;
		}
		if (picture_path.length > 0) {
			updateData.logo = picture_path;
		} else {
			const decoded_logo = decodeURIComponent(
				new URL(currentSello.picture).pathname.slice(1)
			);
			updateData.logo = decoded_logo.replace('media/', '');
		}

		const externalApiRes = await fetch(
			`${process.env.MOVEMUSIC_API}/labels/${data.external_id}`,
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

		const externalApiResJson = await externalApiRes.json();

		if (!externalApiResJson.id) {
			return NextResponse.json(
				{
					success: false,
					error:
						externalApiRes.statusText ||
						'Ha habido un error, estamos trabajando en ello',
				},
				{ status: 400 }
			);
		}

		if (data.password) {
			data.password = await encryptPassword(data.password);
		}
		delete updateData.logo;
		const dataToBBDD = {
			...updateData,
			isMainAccount: true,
			email: data.email,
			password: data.password,

			picture: picture_path.length > 0 ? picture_path : currentSello.picture,
		};
		file && (dataToBBDD.picture = picture_url);

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
		);

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
				const asignaciones = JSON.parse(data.asignaciones);

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
				const newMap = new Map<string, Asignacion>(
					asignaciones.map((asig: Asignacion) => [asig.artista_id._id, asig])
				);

				// Eliminar asignaciones que ya no existen
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
								artista_id: artistaId,
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
								artista_id: artistaId,
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
			console.log('manejar cuentas');
			// Si hay subcuentas, procesarlas
			if (data.subAccounts) {
				const subAccounts = JSON.parse(data.subAccounts) as SubAccount[];

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
	} catch (error) {
		console.error('Error updating sello:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar el sello' },
			{ status: 500 }
		);
	}
}
