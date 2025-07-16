import mongoose, { Schema, Document } from 'mongoose';

export interface IContabilidad extends Document {
	fileName: string;
	fileContent: string; // Base64 del archivo
	fileSize: number;
	uploadedBy: mongoose.Types.ObjectId;
	uploadDate: Date;
	description?: string;
}

const ContabilidadSchema = new Schema<IContabilidad>(
	{
		fileName: {
			type: String,
			required: true,
		},
		fileContent: {
			type: String,
			required: true,
		},
		fileSize: {
			type: Number,
			required: true,
		},
		uploadedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		uploadDate: {
			type: Date,
			default: Date.now,
		},
		description: {
			type: String,
		},
	},
	{
		timestamps: true,
		collection: 'contabilidad',
	}
);

const Contabilidad =
	mongoose.models.Contabilidad ||
	mongoose.model<IContabilidad>('Contabilidad', ContabilidadSchema);

export default Contabilidad;
