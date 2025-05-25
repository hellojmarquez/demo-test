import mongoose, { Schema, Document } from 'mongoose';

export interface ISelloArtistaContrato extends Document {
	sello_id: mongoose.Types.ObjectId;
	artista_id: mongoose.Types.ObjectId;
	fecha_inicio: Date;
	fecha_fin?: Date;
	tipo_contrato: 'exclusivo' | 'no_exclusivo';
	porcentaje_distribucion: number;
	estado: 'activo' | 'inactivo' | 'terminado';
	notas?: string;
	created_at: Date;
	updated_at: Date;
}

const SelloArtistaContratoSchema = new Schema(
	{
		sello_id: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		artista_id: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		fecha_inicio: {
			type: Date,
			required: true,
		},
		fecha_fin: {
			type: Date,
		},
		tipo_contrato: {
			type: String,
			enum: ['exclusivo', 'no_exclusivo'],
			required: true,
		},
		porcentaje_distribucion: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		estado: {
			type: String,
			enum: ['activo', 'inactivo', 'terminado'],
			default: 'activo',
			required: true,
		},
		notas: {
			type: String,
		},
	},
	{
		timestamps: {
			createdAt: 'created_at',
			updatedAt: 'updated_at',
		},
	}
);

// Índices compuestos para búsquedas eficientes
SelloArtistaContratoSchema.index({ sello_id: 1, estado: 1 });
SelloArtistaContratoSchema.index({ artista_id: 1, estado: 1 });
SelloArtistaContratoSchema.index(
	{ sello_id: 1, artista_id: 1 },
	{ unique: true }
);

// Middleware para validar que no exista una asignación activa para el mismo artista
SelloArtistaContratoSchema.pre('save', async function (next) {
	if (this.isNew || this.isModified('estado')) {
		const existingContrato = await mongoose
			.model('SelloArtistaContrato')
			.findOne({
				artista_id: this.artista_id,
				estado: 'activo',
				_id: { $ne: this._id },
			});

		if (existingContrato) {
			throw new Error('El artista ya tiene un contrato activo con otro sello');
		}
	}
	next();
});

export default mongoose.models.SelloArtistaContrato ||
	mongoose.model<ISelloArtistaContrato>(
		'SelloArtistaContrato',
		SelloArtistaContratoSchema
	);
