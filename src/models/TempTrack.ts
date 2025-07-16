import mongoose, { Schema } from 'mongoose';

// Solo los campos necesarios para el procesamiento temporal
const TempTrackSchema = new Schema({
	sessionId: {
		type: String,
		required: true,
		index: true,
	},
	trackData: {
		type: mongoose.Schema.Types.Mixed, // Aquí va TODO el objeto del track
		required: true,
	},
	tempFilePath: String, // Ruta del archivo de audio temporal
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 3600, // Auto-eliminar después de 1 hora
	},
});

export default mongoose.models.TempTrack ||
	mongoose.model('TempTrack', TempTrackSchema);
