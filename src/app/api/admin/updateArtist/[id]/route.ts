export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Artista } from '@/models/UserModel';
import AccountRelationship from '@/models/AccountRelationshipModel';
import { encryptPassword } from '@/utils/auth';
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

		const contentType = req.headers.get('content-type');
		let body: UpdateArtistBody;
		if (contentType?.includes('multipart/form-data')) {
			const formData = await req.formData();
			const password = formData.get('password') as string;
			const subAccounts = formData.get('subAccounts') as string;

			body = {
				name: formData.get('name') as string,
				email: formData.get('email') as string,
				amazon_music_identifier: formData.get(
					'amazon_music_identifier'
				) as string,
				apple_identifier: formData.get('apple_identifier') as string,
				deezer_identifier: formData.get('deezer_identifier') as string,
				spotify_identifier: formData.get('spotify_identifier') as string,
				role: 'artista',
			};

			// Procesar subcuentas si existen
			if (subAccounts) {
				try {
					body.subAccounts = JSON.parse(subAccounts);
				} catch (error) {
					console.error('Error al parsear subcuentas:', error);
				}
			}

			// Solo encriptar password si se proporcionó uno
			if (password) {
				const encryptedPassword = await encryptPassword(password);
				body.password = encryptedPassword;
			}

			// Procesar la imagen si existe
			const picture = formData.get('picture') as string | null;
			if (picture) {
				body.picture = picture;
			}
		} else {
			body = await req.json();
			body.role = 'artista';

			// Si hay password en el JSON, encriptarlo
			if (body.password) {
				body.password = await encryptPassword(body.password);
			}
		}

		// Validar datos requeridos
		if (!body.name || !body.email) {
			return NextResponse.json(
				{ success: false, error: 'Name and email are required' },
				{ status: 400 }
			);
		}

		// Actualizar artista en la API externa
		const artistToApi = {
			name: body.name,
			amazon_music_identifier: body.amazon_music_identifier || '',
			apple_identifier: body.apple_identifier || '',
			deezer_identifier: body.deezer_identifier || '',
			spotify_identifier: body.spotify_identifier || '',
			email: body.email,
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
		const artistRes = await artistReq.json();
		if (!artistRes.id) {
			return NextResponse.json(
				{
					success: false,
					error: artistRes || 'Failed to update artist in external API',
				},
				{ status: artistReq.status }
			);
		}

		// Conectar a la base de datos local
		await dbConnect();

		// Preparar el objeto de actualización
		const updateData = {
			...body,
			// Asegurarnos de que los identificadores vacíos sean strings vacíos
			amazon_music_identifier: body.amazon_music_identifier || '',
			apple_identifier: body.apple_identifier || '',
			deezer_identifier: body.deezer_identifier || '',
			spotify_identifier: body.spotify_identifier || '',
		};

		// Actualizar el usuario en la base de datos local
		const updatedArtist = await Artista.findOneAndUpdate(
			{ external_id: params.id },
			{ $set: updateData },
			{ new: true, runValidators: true }
		);

		if (!updatedArtist) {
			return NextResponse.json(
				{ success: false, error: 'Artista no encontrado' },
				{ status: 404 }
			);
		}
		delete body.picture;

		// Manejar las relaciones de cuentas
		try {
			// Si hay subcuentas, procesarlas
			if (body.subAccounts) {
				const subAccounts = body.subAccounts as SubAccount[];

				// Eliminar relaciones existentes para este mainAccount
				await AccountRelationship.deleteMany({
					mainAccount: updatedArtist._id,
				});

				// Crear nuevas relaciones
				if (subAccounts.length > 0) {
					const relationships = subAccounts.map(subAccount => ({
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
