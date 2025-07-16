import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/UserModel';
import { encryptPassword } from '@/utils/auth';
import { jwtVerify } from 'jose';
import { createLog } from '@/lib/logger';

interface UpdateData {
	name: string;
	email: string;
	status: string;
	updatedAt: Date;
	password?: string;
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
		const { name, email, status, password } = await req.json();

		if (!name || !email || !status) {
			return NextResponse.json(
				{ error: 'Nombre, email y estado son requeridos' },
				{ status: 400 }
			);
		}

		await dbConnect();

		// Validar que el status sea uno de los valores permitidos
		if (!['activo', 'inactivo', 'banneado'].includes(status)) {
			return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
		}

		// Validar formato de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json(
				{ error: 'Formato de email inválido' },
				{ status: 400 }
			);
		}

		// Verificar si el email ya está en uso por otro usuario
		const existingUser = await User.findOne({
			email,
			external_id: { $ne: id },
		});
		if (existingUser) {
			return NextResponse.json(
				{ error: 'El email ya está en uso por otro usuario' },
				{ status: 400 }
			);
		}

		// Preparar los datos de actualización
		const updateDataToApi = {
			name,
			email,
		};

		// Preparar datos para la base de datos
		const updatedDataToDDBB: UpdateData = {
			name,
			email,
			status,
			updatedAt: new Date(),
		};

		// Si se proporcionó una nueva contraseña, hashearla y agregarla
		if (password) {
			const hashedPassword = await encryptPassword(password);
			updatedDataToDDBB.password = hashedPassword;
		}

		// Llamar a la API externa con la estructura completa
		try {
			const externalApiRes = await fetch(
				`${process.env.MOVEMUSIC_API}/contributors/${params.id}`,
				{
					method: 'PUT',
					body: JSON.stringify(updateDataToApi),
					headers: {
						'Content-Type': 'application/json',
						Authorization: `JWT ${moveMusicAccessToken}`,
						'x-api-key': process.env.MOVEMUSIC_X_APY_KEY || '',
						Referer: process.env.MOVEMUSIC_REFERER || '',
					},
				}
			);
			const res = await externalApiRes.json();
			if (!externalApiRes.ok) {
				return NextResponse.json(
					{
						success: false,
						error: res || 'Error en API externa',
					},
					{ status: 400 }
				);
			}
		} catch (apiError: any) {
			console.error('Hubo un error, estamos trabajando para solucionarlo');
			return NextResponse.json(
				{
					success: false,
					error: apiError.message || 'Error en API externa',
				},
				{ status: 500 }
			);
		}
		// Actualizar el contribuidor usando external_id
		const updatedContributor = await User.findOneAndUpdate(
			{ external_id: id },
			{ $set: updatedDataToDDBB },
			{ new: true }
		).select('-password');

		if (!updatedContributor) {
			return NextResponse.json(
				{
					success: false,
					error: 'No se pudo actualizar el contribuidor en la base de datos',
				},
				{ status: 500 }
			);
		}
		try {
			// Crear el log
			const logData = {
				action: 'UPDATE' as const,
				entity: 'USER' as const,
				entityId: updatedContributor._id.toString(),
				userId: verifiedPayload.id as string,
				userName: (verifiedPayload.name as string) || 'Usuario sin nombre',
				userRole: verifiedPayload.role as string,
				details: `Contributopr actualizado: ${name}`,
				ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
			};

			await createLog(logData);
		} catch (logError) {
			console.error('Error al crear el log:', logError);
			// No interrumpimos el flujo si falla el log
		}
		return NextResponse.json({
			success: true,
			message: 'Contribuidor actualizado exitosamente',
			contributor: updatedContributor,
		});
	} catch (error: any) {
		console.error('Error updating contributor:', error);
		return NextResponse.json(
			{
				error: error.message || 'Error interno del servidor',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
