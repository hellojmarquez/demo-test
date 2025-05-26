import dbConnect from '@/lib/dbConnect';
import Log from '@/models/LogModel';
import mongoose from 'mongoose';

interface LogParams {
	action: 'CREATE' | 'UPDATE' | 'DELETE';
	entity: 'USER' | 'PRODUCT' | 'RELEASE' | 'TRACK';
	entityId: string;
	userId: string;
	userName: string;
	userRole: string;
	details: string;
	ipAddress: string;
}

export async function createLog(params: LogParams) {
	try {
		// Verificar si ya estamos conectados
		if (mongoose.connection.readyState !== 1) {
			await dbConnect();
		}

		// Convertir userId a ObjectId si es necesario
		const logData = {
			...params,
			userId: new mongoose.Types.ObjectId(params.userId),
		};

		const log = await Log.create(logData);
		console.log('Log creado exitosamente:', log._id);
		return log;
	} catch (error) {
		console.error('Error al crear log:', error);
		// Propagar el error para que el endpoint pueda manejarlo
		throw error;
	}
}
