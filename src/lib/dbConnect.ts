import mongoose from 'mongoose';

interface Connection {
	isConnected?: number;
}

const connection: Connection = {};

async function dbConnect(): Promise<number | undefined> {
	try {
		if (connection.isConnected) {
			return connection.isConnected;
		}

		if (!process.env.MONGODB_URI) {
			throw new Error('MONGODB_URI environment variable is not defined');
		}

		const db = await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});

		connection.isConnected = db.connections[0].readyState;
		return connection.isConnected;
	} catch (error) {
		console.error('MongoDB Connection Error:', error);
		throw error;
	}
}

export default dbConnect;
