// app/api/admin/getAllUsers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';

export async function GET(req: NextRequest) {
	console.log('get users received');

	try {
		await dbConnect();

		// Obtener todos los usuarios de la base de datos
		const users = await User.find({}).select('-password');
		const sanitizedUsers = users.map(user => {
			const userObj = user.toObject(); // Convertir a objeto plano
			return {
				...userObj,
				picture: userObj.picture
					? {
							base64: userObj.picture.toString('base64'),
					  }
					: null,
				subcuentas: userObj.subcuentas
					? userObj.subcuentas.map((sub: any) => ({
							...sub,
							password: '',
					  }))
					: [],
			};
		});

		// Puedes devolver directamente los usuarios
		return NextResponse.json({
			success: true,
			users: sanitizedUsers,
		});
	} catch (error) {
		console.error('Error fetching users:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
