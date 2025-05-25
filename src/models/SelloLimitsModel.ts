import mongoose, { Schema, Document } from 'mongoose';

export interface ISelloLimits extends Document {
	sello_id: mongoose.Types.ObjectId;
	originalLimit: number;
	extendedLimit: number;
	startDate: Date;
	endDate: Date;
	status: 'activo' | 'expired' | 'cancelled';
	paymentDetails: {
		amount: number;
		paymentDate: Date;
		transactionId: string;
	};
	createdAt: Date;
	updatedAt: Date;
}

const SelloLimitsSchema = new Schema<ISelloLimits>(
	{
		sello_id: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		originalLimit: {
			type: Number,
			required: true,
			default: 3,
		},
		extendedLimit: {
			type: Number,
			required: true,
			min: 4, // El límite extendido debe ser mayor que el original
		},
		startDate: {
			type: Date,
			required: true,
			default: Date.now,
		},
		endDate: {
			type: Date,
			required: true,
		},
		status: {
			type: String,
			enum: ['activo', 'expired', 'cancelled'],
			default: 'activo',
		},
		paymentDetails: {
			amount: {
				type: Number,
				required: true,
			},
			paymentDate: {
				type: Date,
				required: true,
				default: Date.now,
			},
			transactionId: {
				type: String,
				required: true,
			},
		},
	},
	{
		timestamps: true,
	}
);

// Índices para búsquedas eficientes
SelloLimitsSchema.index({ sello_id: 1, status: 1 });
SelloLimitsSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 }); // Para expiración automática

// Middleware para actualizar el límite del sello cuando se crea o actualiza un límite extendido
SelloLimitsSchema.pre('save', async function (next) {
	if (this.isNew || this.isModified('status')) {
		const User = mongoose.model('User');
		try {
			if (this.status === 'activo') {
				// Actualizar el límite del sello al límite extendido
				await User.findByIdAndUpdate(this.sello_id, {
					artistLimit: this.extendedLimit,
					hasExtendedLimit: true,
					limitExpirationDate: this.endDate,
				});
			} else if (this.status === 'expired' || this.status === 'cancelled') {
				// Restaurar el límite original del sello
				await User.findByIdAndUpdate(this.sello_id, {
					artistLimit: this.originalLimit,
					hasExtendedLimit: false,
					limitExpirationDate: null,
				});
			}
		} catch (error) {
			return next(error as Error);
		}
	}
	next();
});

const SelloLimits =
	mongoose.models.SelloLimits ||
	mongoose.model<ISelloLimits>('SelloLimits', SelloLimitsSchema);

export default SelloLimits;
