import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AccountRelationship from '@/models/AccountRelationshipModel';
import { jwtVerify } from 'jose';

export async function GET(
	req: NextRequest,
	{ params }: { params: { userId: string } }
) {
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
			console.error('JWT verification failed', err);
			return NextResponse.json(
				{ success: false, error: 'Invalid token' },
				{ status: 401 }
			);
		}

		// Conectar a la base de datos
		await dbConnect();

		const userId = params.userId;

		// Buscar relaciones donde el usuario es subcuenta
		const mainAccountRelation = await AccountRelationship.findOne({
			subAccountId: userId,
		}).populate('mainAccountId', 'name email role');

		// Buscar relaciones donde el usuario es cuenta principal
		const subAccountsRelations = await AccountRelationship.find({
			mainAccountId: userId,
		}).populate('subAccountId', 'name email role picture');
	
		// Formatear la respuesta
		const mainAccount = mainAccountRelation
			? {
					_id: mainAccountRelation.mainAccountId._id,
					name: mainAccountRelation.mainAccountId.name,
					email: mainAccountRelation.mainAccountId.email,
					role: mainAccountRelation.mainAccountId.role,
					picture: mainAccountRelation.mainAccountId.picture,
			  }
			: null;

		const subAccounts = subAccountsRelations.map(relation => ({
			_id: relation.subAccountId._id,
			name: relation.subAccountId.name,
			email: relation.subAccountId.email,
			role: relation.role,
			status: relation.status,
			picture: relation.subAccountId.picture,
		}));

		return NextResponse.json({
			success: true,
			data: {
				mainAccount,
				subAccounts,
			},
		});
	} catch (error) {
		console.error('Error in getUserRelations:', error);
		return NextResponse.json(
			{ success: false, error: 'Error al obtener las relaciones' },
			{ status: 500 }
		);
	}
}
