import mongoose from 'mongoose';

// Esquema para las relaciones entre cuentas
const accountRelationshipSchema = new mongoose.Schema(
	{
		mainAccountId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		subAccountId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		role: {
			type: String,
			enum: ['artist', 'label', 'publisher', 'contributor'],
			required: true,
		},
		status: {
			type: String,
			enum: ['activo', 'inactivo'],
			default: 'activo',
		},
		permissions: {
			type: [String],
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
	},
	{
		timestamps: true,
	}
);

// Índices para mejorar el rendimiento de las consultas
accountRelationshipSchema.index(
	{ mainAccountId: 1, subAccountId: 1 },
	{ unique: true }
);
accountRelationshipSchema.index({ status: 1 });

// Método para encontrar todas las subcuentas de una cuenta principal
accountRelationshipSchema.statics.findSubAccounts = function (
	mainAccountId: string
) {
	return this.find({ mainAccountId, status: 'activo' }).populate(
		'subAccountId'
	);
};

// Método para encontrar todas las cuentas principales de una subcuenta
accountRelationshipSchema.statics.findMainAccounts = function (
	subAccountId: string
) {
	return this.find({ subAccountId, status: 'activo' }).populate(
		'mainAccountId'
	);
};

// Método para verificar si existe una relación activa
accountRelationshipSchema.statics.hasActiveRelationship = function (
	mainAccountId: string,
	subAccountId: string
) {
	return this.findOne({
		mainAccountId,
		subAccountId,
		status: 'activo',
	});
};

// Crear el modelo
const AccountRelationship =
	mongoose.models.AccountRelationship ||
	mongoose.model('AccountRelationship', accountRelationshipSchema);

export default AccountRelationship;
