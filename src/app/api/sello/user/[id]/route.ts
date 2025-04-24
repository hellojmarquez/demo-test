import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await dbConnect();

		const { id } = await params;

		if (!id) {
			return NextResponse.json(
				{ error: 'User ID is required' },
				{ status: 400 }
			);
		}

		const user = await User.findById(id);

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({
			data: user,
			message: 'User fetched successfully',
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
}
// username: rest-api-cmmg
// email: charlie@cmmgdistro.com
export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await dbConnect();

		const { id } = await params;

		if (!id) {
			return NextResponse.json(
				{ error: 'User ID is required' },
				{ status: 400 }
			);
		}

		const user = await User.findByIdAndDelete(id);

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({
			message: 'User deleted successfully',
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
}
