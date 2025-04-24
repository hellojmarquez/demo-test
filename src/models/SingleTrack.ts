// models/SingleTrack.ts
import mongoose, { Schema } from 'mongoose';

// Esquema para cada artista asociado
const ArtistSchema = new Schema(
	{
		id: { type: Number, required: true },
		artist: { type: Number, required: true },
		kind: { type: String, required: true },
		order: { type: Number, required: true },
	},
	{ _id: false }
);

// Esquema para cada publisher asociado
const PublisherSchema = new Schema(
	{
		id: { type: Number, required: true },
		publisher: { type: Number, required: true },
		author: { type: String, required: true },
		order: { type: Number, required: true },
	},
	{ _id: false }
);

// Esquema para cada contributor asociado
const ContributorSchema = new Schema(
	{
		id: { type: Number, required: true },
		contributor: { type: Number, required: true },
		role: { type: Number, required: true },
		order: { type: Number, required: true },
	},
	{ _id: false }
);

// Esquema principal
const SingleTrackSchema = new Schema(
	{
		order: { type: Number },
		release: { type: Number },
		name: { type: String },
		mix_name: { type: String },
		language: { type: String },
		vocals: { type: String },

		// Arrays de objetos con tipos específicos
		artists: {
			type: [ArtistSchema], // Esto acepta cualquier tipo de datos
			default: [],
		},
		publishers: {
			type: [PublisherSchema],
			default: [],
		},
		contributors: {
			type: [ContributorSchema],
			default: [],
		},

		label_share: { type: String },
		genre: { type: String },
		subgenre: { type: String },
		resource: { type: String },
		dolby_atmos_resource: { type: String },
		copyright_holder: { type: String },
		copyright_holder_year: { type: String },
		album_only: { type: Boolean },
		sample_start: { type: String },
		explicit_content: { type: Boolean },
		ISRC: { type: String },
		generate_isrc: { type: Boolean },
		DA_ISRC: { type: String },
		track_lenght: { type: String },
	},
	{ timestamps: true }
);

// Verificar si el modelo ya existe antes de crear uno nuevo
const SingleTrack =
	mongoose.models.SingleTrack ||
	mongoose.model('SingleTrack', SingleTrackSchema);

export default SingleTrack;
