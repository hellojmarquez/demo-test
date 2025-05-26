import Log from '@/models/LogModel';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export const createLog = async (
	req: NextRequest,
	action: string,
	entity: string,
	details: string
) => {
	try {
		const token = req.cookies.get('loginToken')?.value;
		if (!token) return;

		const { payload: verifiedPayload } = await jwtVerify(
			token,
			new TextEncoder().encode(process.env.JWT_SECRET)
		);

		const log = new Log({
			user: verifiedPayload.id,
			userName: verifiedPayload.name,
			userRole: verifiedPayload.role,
			action,
			entity,
			details,
			ip: req.headers.get('x-forwarded-for') || req.ip,
		});

		await log.save();
	} catch (error) {
		console.error('Error creating log:', error);
	}
};

export const saveLog = async (
	message: string,
	level: 'info' | 'warning' | 'error' = 'info',
	metadata = {}
) => {
	try {
		await Log.create({ message, level, metadata });
	} catch (error) {
		console.error('Failed to save log:', error);
	}
};

export const getLogs = async (limit = 100) => {
	try {
		return await Log.find({}).sort({ createdAt: -1 }).limit(limit);
	} catch (error) {
		console.error('Failed to retrieve logs:', error);
		return [];
	}
};
