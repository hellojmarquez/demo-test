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

		console.log('Attempting to connect to MongoDB...');
		console.log('MongoDB URI:', process.env.MONGODB_URI);

		const db = await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});

		connection.isConnected = db.connections[0].readyState;
		console.log('MongoDB Connected Successfully');
		return connection.isConnected;
	} catch (error) {
		console.error('MongoDB Connection Error:', error);
		throw error;
	}
}

export default dbConnect;
