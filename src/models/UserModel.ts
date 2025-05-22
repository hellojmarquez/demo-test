import { IUser } from '@/types';
import mongoose from 'mongoose';

// Esquema base común para todos los usuarios
const baseUserSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			unique: true,
			required: true,
		},
		password: {
			type: String,
			required: function (this: any) {
				return this.tipo === 'principal';
			},
		},
		role: {
			type: String,
			enum: ['user', 'sello', 'artista', 'contributor', 'publisher', 'admin'],
			required: true,
		},
		status: {
			type: String,
			default: 'active',
		},
		tipo: {
			type: String,
			enum: ['principal', 'subcuenta'],
			default: 'principal',
			required: true,
		},
		external_id: {
			type: Number,
			required: false,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ discriminatorKey: 'role' }
);

// Esquema específico para administradores
const adminSchema = new mongoose.Schema({
	permissions: {
		type: Array,
		default: ['admin'],
	},
	picture: {
		type: mongoose.Schema.Types.Mixed,
		default: null,
	},
});

// Esquema específico para sellos
const selloSchema = new mongoose.Schema({
	artistLimit: {
		type: Number,
		default: 3,
	},
	hasExtendedLimit: {
		type: Boolean,
		default: false,
	},
	limitExpirationDate: {
		type: Date,
		default: null,
	},
	catalog_num: {
		type: Number,
		default: null,
	},
	year: {
		type: Number,
		default: null,
	},
	picture: {
		type: mongoose.Schema.Types.Mixed,
		default: null,
	},
});

// Esquema específico para artistas
const artistSchema = new mongoose.Schema({
	amazon_music_identifier: {
		type: String,
		default: '',
	},
	apple_identifier: {
		type: String,
		default: '',
	},
	deezer_identifier: {
		type: String,
		default: '',
	},
	spotify_identifier: {
		type: String,
		default: '',
	},
	picture: {
		type: String,
		default: '',
	},
});

// Esquema específico para contribuidores
const contributorSchema = new mongoose.Schema({
	// No fields needed, inherits all from baseUserSchema
});

// Esquema específico para publishers
const publisherSchema = new mongoose.Schema({
	picture: {
		type: mongoose.Schema.Types.Mixed,
		default: null,
	},
});

// Crear el modelo base solo si no existe
const User =
	mongoose.models.User || mongoose.model<IUser>('User', baseUserSchema);

// Crear los discriminadores solo si no existen
const Admin = mongoose.models.admin || User.discriminator('admin', adminSchema);
const Sello = mongoose.models.sello || User.discriminator('sello', selloSchema);
const Artista =
	mongoose.models.artista || User.discriminator('artista', artistSchema);
const Contributor =
	mongoose.models.contributor ||
	User.discriminator('contributor', contributorSchema);
const Publisher =
	mongoose.models.publisher || User.discriminator('publisher', publisherSchema);

export { User, Admin, Sello, Artista, Contributor, Publisher };
export default User;
