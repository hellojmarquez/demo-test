export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		await dbConnect();
		const sellos = await User.find({ role: 'sello' })
			.select('-password')
			.sort({ createdAt: -1 });

		// Obtener la información completa de las subcuentas
		const sellosConSubcuentas = await Promise.all(
			sellos.map(async sello => {
				const selloObj = sello.toObject();
				if (selloObj.subaccounts && selloObj.subaccounts.length > 0) {
					const subcuentas = await User.find({
						_id: { $in: selloObj.subaccounts },
					}).select('name _id');
					selloObj.subaccounts = subcuentas.map(sub => ({
						_id: sub._id,
						name: sub.name,
					}));
				}
				return selloObj;
			})
		);

		return NextResponse.json({
			success: true,
			data: sellosConSubcuentas,
		});
	} catch (error) {
		console.error('Error al obtener sellos:', error);
		return NextResponse.json(
			{ success: false, error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
