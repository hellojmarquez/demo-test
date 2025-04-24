import mongoose, { Schema, model, models } from 'mongoose';

const logSchema = new Schema(
  {
    message: { type: String, required: true },
    level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' },
    createdAt: { type: Date, default: Date.now },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const Log = models.Log || model('Log', logSchema);
