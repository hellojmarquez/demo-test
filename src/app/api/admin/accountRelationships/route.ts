import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AccountRelationship from '@/models/AccountRelationshipModel';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
	try {
		// Verificar autenticación
		const token = req.cookies.get('loginToken')?.value;
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
		
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		// Conectar a la base de datos
		await dbConnect();

		// Obtener datos del body
		const body = await req.json();
		const { mainAccountId, subAccounts } = body;

		if (!mainAccountId || !subAccounts || !Array.isArray(subAccounts)) {
			return NextResponse.json(
				{ success: false, error: 'Datos inválidos' },
				{ status: 400 }
			);
		}

		// Eliminar relaciones existentes para este mainAccount
		await AccountRelationship.deleteMany({ mainAccount: mainAccountId });

		// Crear nuevas relaciones
		const relationships = subAccounts.map(subAccount => ({
			mainAccount: mainAccountId,
			subAccount: subAccount.subAccountId,
			status: 'activo',
		}));

		// Insertar todas las relaciones
		await AccountRelationship.insertMany(relationships);

		return NextResponse.json({
			success: true,
			message: 'Relaciones creadas exitosamente',
		});
	} catch (error) {
	
		return NextResponse.json(
			{ success: false, error: 'Error al crear las relaciones' },
			{ status: 500 }
		);
	}
}

export async function DELETE(req: NextRequest) {
	try {
		// Verificar autenticación
		const token = req.cookies.get('loginToken')?.value;
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
		
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		// Conectar a la base de datos
		await dbConnect();

		// Obtener datos del body
		const body = await req.json();
		const { mainAccountId, subAccountId } = body;

		if (!mainAccountId || !subAccountId) {
			return NextResponse.json(
				{ success: false, error: 'Datos inválidos' },
				{ status: 400 }
			);
		}

		// Eliminar la relación específica
		const result = await AccountRelationship.deleteOne({
			mainAccountId: mainAccountId,
			subAccountId: subAccountId,
		});

		if (result.deletedCount === 0) {
			return NextResponse.json(
				{ success: false, error: 'No se encontró la relación' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: 'Relación eliminada exitosamente',
			deletedCount: result.deletedCount,
		});
	} catch (error) {
	
		return NextResponse.json(
			{ success: false, error: 'Error al eliminar la relación' },
			{ status: 500 }
		);
	}
}
