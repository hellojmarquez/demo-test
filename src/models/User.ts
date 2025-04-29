import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'El nombre es requerido'],
			trim: true,
		},
		email: {
			type: String,
			required: [true, 'El email es requerido'],
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: [true, 'La contraseña es requerida'],
		},
		picture: {
			base64: {
				type: String,
			},
		},
		role: {
			type: String,
			enum: ['admin', 'sello', 'artista'],
			required: true,
		},
		status: {
			type: String,
			enum: ['active', 'inactive'],
			default: 'active',
		},
		permissions: [
			{
				type: String,
				enum: ['admin', 'sello', 'artista'],
			},
		],
		lastConnection: {
			type: Date,
		},
		lastConnectionIP: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

// Evitar que se cree el modelo si ya existe
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
