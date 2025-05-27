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
				return this.isMainAccount === true;
			},
		},
		role: {
			type: String,
			enum: ['user', 'sello', 'artista', 'contributor', 'publisher', 'admin'],
			required: true,
		},
		status: {
			type: String,
			enum: ['activo', 'inactivo', 'banneado'],
			default: 'activo',
		},
		isMainAccount: {
			type: Boolean,
			default: true,
			required: true,
		},
		external_id: {
			type: Number,
			required: false,
		},
		picture: {
			type: String,
			default: null,
		},
		lastLogin: {
			type: Date,
			default: null,
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
	{
		timestamps: true,
		discriminatorKey: 'role',
	}
);

// Índices para mejorar el rendimiento de las consultas
baseUserSchema.index({ email: 1 });
baseUserSchema.index({ isMainAccount: 1 });
baseUserSchema.index({ status: 1 });

// Método para encontrar todas las subcuentas de un usuario
baseUserSchema.statics.findSubAccounts = function (mainAccountId: string) {
	return this.find({
		mainAccountId,
		isMainAccount: false,
		status: 'activo',
	});
};

// Método para encontrar la cuenta principal de una subcuenta
baseUserSchema.statics.findMainAccount = function (subAccountId: string) {
	return this.findOne({
		_id: subAccountId,
		isMainAccount: false,
		status: 'activo',
	}).populate('mainAccountId');
};

// Esquema específico para administradores
const adminSchema = new mongoose.Schema({
	permissions: {
		type: Array,
		default: ['admin'],
	},
});

// Esquema específico para sellos
const selloSchema = new mongoose.Schema({
	external_id: {
		type: Number,
		required: true,
	},
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
	primary_genre: {
		type: String,
		required: false,
		select: true,
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
});

// Esquema específico para contribuidores
const contributorSchema = new mongoose.Schema({
	// No fields needed, inherits all from baseUserSchema
});

// Esquema específico para publishers
const publisherSchema = new mongoose.Schema({
	// No fields needed, inherits all from baseUserSchema
});

// Función para inicializar los modelos
function initializeModels() {
	// Crear el modelo base solo si no existe
	const User =
		mongoose.models.User || mongoose.model<IUser>('User', baseUserSchema);

	// Crear los discriminadores solo si no existen
	const Admin =
		mongoose.models.admin || User.discriminator('admin', adminSchema);
	const Sello =
		mongoose.models.sello || User.discriminator('sello', selloSchema);
	const Artista =
		mongoose.models.artista || User.discriminator('artista', artistSchema);
	const Contributor =
		mongoose.models.contributor ||
		User.discriminator('contributor', contributorSchema);
	const Publisher =
		mongoose.models.publisher ||
		User.discriminator('publisher', publisherSchema);

	return { User, Admin, Sello, Artista, Contributor, Publisher };
}

// Inicializar los modelos
const { User, Admin, Sello, Artista, Contributor, Publisher } =
	initializeModels();

export { User, Admin, Sello, Artista, Contributor, Publisher };
export default User;
