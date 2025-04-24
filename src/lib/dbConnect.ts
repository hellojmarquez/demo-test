import mongoose from 'mongoose';

interface Connection {
	isConnected?: number;
}

const connection: Connection = {};

async function dbConnect(): Promise<number | undefined> {
	if (connection.isConnected) {
		return connection.isConnected;
	}

	if (!process.env.MONGODB_URI) {
		throw new Error('MONGODB_URI environment variable is not defined');
	}

	const db = await mongoose.connect(process.env.MONGODB_URI);

	connection.isConnected = db.connections[0].readyState;
	console.log(connection.isConnected ? 'DB Connected' : 'DB Connection Failed');
	return connection.isConnected;
}

export default dbConnect;
