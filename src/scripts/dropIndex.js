const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('Connected to MongoDB');

		const db = mongoose.connection.db;
		await db.collection('users').dropIndex('external_id_1');
		console.log('Index external_id_1 dropped successfully');

		await mongoose.connection.close();
		console.log('Connection closed');
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}
}

dropIndex();
