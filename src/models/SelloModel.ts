import mongoose, { Schema, Document } from 'mongoose';
import { Binary } from 'mongodb';

export interface ILogo {
	thumb_medium: string;
	thumb_small: string;
	full_size: string;
}

export interface ISello extends Document {
	id: number;
	catalog_num: number;
	company: string;
	contract_received: boolean;
	information_accepted: boolean;
	label_approved: boolean;
	logo: ILogo;
	name: string;
	primary_genre: string;
	year: number;
	picture?: Binary;
}

const SelloSchema: Schema = new Schema({
	id: { type: Number, required: true, unique: true },
	catalog_num: { type: Number },
	company: { type: String },
	contract_received: { type: Boolean, default: false },
	information_accepted: { type: Boolean, default: false },
	label_approved: { type: Boolean, default: false },
	logo: {
		thumb_medium: { type: String },
		thumb_small: { type: String },
		full_size: { type: String },
	},
	name: { type: String, required: true },
	primary_genre: { type: String },
	year: { type: Number },
	picture: { type: Schema.Types.Mixed }, // Esto permitirá almacenar datos binarios
});

// Verificar si el modelo ya existe para evitar errores en desarrollo con hot reload
export default mongoose.models.Sello ||
	mongoose.model<ISello>('Sello', SelloSchema);
