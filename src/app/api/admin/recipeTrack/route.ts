import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { comparePassword } from '@/utils/auth';
import { createLog } from '@/lib/logger';
export async function POST(req: NextRequest) {
	try {
		const { url } = await req.json();
		console.log(url);
		return NextResponse.json({ message: 'ok' });
	} catch (error) {
		console.error('Error en la solicitud de login:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
