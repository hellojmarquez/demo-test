const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		const db = mongoose.connection.db;
		await db.collection('users').dropIndex('external_id_1');
		await mongoose.connection.close();
	} catch (error) {
		process.exit(1);
	}
}

dropIndex();
