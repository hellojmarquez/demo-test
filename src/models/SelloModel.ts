import mongoose, { Schema, Document } from 'mongoose';
export interface IArtist {
	id: number | string;
	name: string;
}
export interface ISello extends Document {
	external_id: string;
	name: string;
	picture: string | Buffer;
	primary_genre_id: number | string;
	primary_genre_name: string;
	year: number;
	catalog_num: string;
	assigned_artists: IArtist[];
	api_id?: string | number;
	created_at: Date;
	updated_at?: Date;
}

const SelloSchema: Schema = new Schema({
	external_id: {
		type: String,
	},
	name: { type: String, required: true },
	primary_genre_id: { type: Schema.Types.Mixed },
	primary_genre_name: { type: String },
	year: { type: Number },
	catalog_num: { type: String },
	assigned_artists: [
		{
			id: { type: Schema.Types.Mixed },
			name: { type: String },
		},
	],
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	picture: {
		type: Schema.Types.Mixed,
		default: '/avatar.png',
	},
	subaccounts: {
		type: Array,
		default: [],
	},

	updatedAt: {
		type: Date,
		default: Date.now,
	},
	lastConnection: {
		type: Date,
		default: Date.now,
	},
	lastConnectionIP: {
		type: String,
		default: '',
	},
	role: {
		type: String,
		default: 'artist',
		required: true,
	},
	status: {
		type: String,
		default: 'active',
	},

	artists: {
		type: Array,
		default: [],
	},
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date },
});

// Ensure the model converts the API ID correctly
SelloSchema.pre('save', function (next) {
	// Make sure external_id is properly converted to a number if it exists
	if (this.external_id && typeof this.external_id === 'string') {
		this.external_id = parseInt(this.external_id, 10);
	}
	next();
});

// Verificar si el modelo ya existe para evitar errores en desarrollo con hot reload
export default mongoose.models.Sello ||
	mongoose.model<ISello>('Sello', SelloSchema);
