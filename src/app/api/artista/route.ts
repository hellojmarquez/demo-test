import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { FugaAPI } from '@/services/FugaAPI';
import { comparePassword } from '@/utils/auth';
import { setToken } from '@/utils/cookies';
import { generateToken, verifyToken } from '@/utils/jwt';
import { getTokenBack } from '@/utils/tokenBack';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		dbConnect();

		const token = await getTokenBack(req);

		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const session = verifyToken(token);

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = session.user;

		const me = await User.findById(user._id, { password: 0 });

		if (!me) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { artist } = await FugaAPI.getArtists({ page: 0, pageSize: 20 });

		const allowedArtists = artist.filter((artist: any) =>
			me.artists.includes(artist.id)
		);

		return NextResponse.json(allowedArtists);
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
}

export async function POST(req: NextRequest) {
	try {
		dbConnect();

		const token = await getTokenBack(req);

		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const session = verifyToken(token);

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = session.user;

		const me = await User.findById(user._id, { password: 0 });

		if (!me) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (me.role !== 'label') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();

		const newArtist = await FugaAPI.createArtist(body);

		me.artists.push(String(newArtist.id));

		await me.save();

		return NextResponse.json(newArtist);
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
}
