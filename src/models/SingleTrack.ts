// models/SingleTrack.ts
import mongoose from 'mongoose';

// Esquema para cada artista asociado
const ArtistSchema = new mongoose.Schema(
	{
		id: { type: Number, required: true },
		artist: { type: Number, required: true },
		kind: { type: String, required: true },
		order: { type: Number, required: true },
	},
	{ _id: false }
);

// Esquema para cada publisher asociado
const PublisherSchema = new mongoose.Schema(
	{
		id: { type: Number, required: true },
		publisher: { type: Number, required: true },
		author: { type: String, required: true },
		order: { type: Number, required: true },
	},
	{ _id: false }
);

// Esquema para cada contributor asociado
const ContributorSchema = new mongoose.Schema(
	{
		id: { type: Number, required: true },
		contributor: { type: Number, required: true },
		role: { type: Number, required: true },
		order: { type: Number, required: true },
	},
	{ _id: false }
);

// Esquema principal
const SingleTrackSchema = new mongoose.Schema(
	{
		order: {
			type: Number,
			default: null,
		},
		release: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Release',
			default: null,
		},
		name: {
			type: String,
			required: true,
		},
		mix_name: {
			type: String,
			default: null,
		},
		language: {
			type: String,
			required: true,
		},
		vocals: {
			type: String,
			default: null,
		},

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

		label_share: {
			type: String,
			default: null,
		},
		genre: {
			type: String,
			default: null,
		},
		subgenre: {
			type: String,
			default: null,
		},
		resource: {
			type: String,
			default: null,
		},
		dolby_atmos_resource: {
			type: String,
			default: null,
		},
		copyright_holder: {
			type: String,
			default: null,
		},
		copyright_holder_year: {
			type: String,
			default: null,
		},
		album_only: {
			type: Boolean,
			default: false,
		},
		sample_start: {
			type: String,
			default: null,
		},
		explicit_content: {
			type: Boolean,
			default: false,
		},
		ISRC: {
			type: String,
			default: null,
		},
		generate_isrc: {
			type: Boolean,
			default: false,
		},
		DA_ISRC: {
			type: String,
			default: null,
		},
		track_lenght: {
			type: String,
			default: null,
		},
	},
	{ timestamps: true }
);

// Verificar si el modelo ya existe antes de crear uno nuevo
const SingleTrack =
	mongoose.models.SingleTrack ||
	mongoose.model('SingleTrack', SingleTrackSchema);

export default SingleTrack;
