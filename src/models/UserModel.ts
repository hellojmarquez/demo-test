import { IUser } from '@/types';
import mongoose from 'mongoose';

if (mongoose.models.User) {
	delete mongoose.models.User;
}

const UserSchema = new mongoose.Schema({
	external_id: {
		type: String,
		unique: true,
	},
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		unique: true,
	},
	password: {
		type: String,
	},
	picture: {
		type: Buffer,
		default: null,
	},
	subaccounts: {
		type: Array,
		default: [],
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},

	role: {
		type: String,
		default: 'user',
		enum: ['user', 'artista', 'contributor', 'publisher', 'admin'],
		required: true,
	},
	status: {
		type: String,
		default: 'active',
	},
	permissions: {
		type: Array,
		default: [],
	},
	artists: {
		type: Array,
		default: [],
	},
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
	primary_genre: {
		type: String,
		default: '',
	},
	year: {
		type: Number,
		default: null,
	},
	catalog_num: {
		type: Number,
		default: null,
	},
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
