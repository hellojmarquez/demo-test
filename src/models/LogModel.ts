import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
	{
		action: {
			type: String,
			required: true,
			enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'],
		},
		entity: {
			type: String,
			required: true,
			enum: ['USER', 'PRODUCT', 'RELEASE', 'TRACK'],
		},
		entityId: {
			type: String,
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		userName: {
			type: String,
			required: true,
		},
		userRole: {
			type: String,
			required: true,
		},
		details: {
			type: String,
			required: true,
		},
		ipAddress: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// Índices para mejorar el rendimiento de las búsquedas
logSchema.index({ action: 1 });
logSchema.index({ entity: 1 });
logSchema.index({ userId: 1 });
logSchema.index({ createdAt: -1 });

const Log = mongoose.models.Log || mongoose.model('Log', logSchema);

export default Log;
