// models/SingleTrack.ts
import mongoose from 'mongoose';

// Esquema para cada artista asociado
const ArtistSchema = new mongoose.Schema(
	{
		artist: { type: Number, required: true },
		kind: { type: String, required: true },
		order: { type: Number, required: true },
		name: { type: String, required: true },
	},
	{ _id: false }
);

// Esquema para cada publisher asociado
const PublisherSchema = new mongoose.Schema(
	{
		publisher: { type: Number, required: true },
		author: { type: String, required: true },
		order: { type: Number, required: true },
		name: { type: String, required: true },
	},
	{ _id: false }
);

// Esquema para cada contributor asociado
const ContributorSchema = new mongoose.Schema(
	{
		contributor: { type: Number, required: true },
		role: { type: Number, required: true },
		order: { type: Number, required: true },
		name: { type: String, required: true },
		role_name: { type: String, required: true },
	},
	{ _id: false }
);

// Esquema principal
const SingleTrackSchema = new mongoose.Schema(
	{
		order: {
			type: Number,
			default: 0,
		},
		external_id: {
			type: Number,
			default: 0,
		},
		release: {
			type: Number,
			default: null,
		},
		status: {
			type: String,
			default: 'Borrador',
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
			default: 'ES',
		},

		// Arrays de objetos con tipos específicos
		artists: {
			type: [ArtistSchema],
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
			type: Number,
			required: true,
			default: 0,
		},
		genre_name: {
			type: String,
			required: true,
			default: '',
		},
		subgenre: {
			type: Number,
			required: true,
			default: 0,
		},
		subgenre_name: {
			type: String,
			required: true,
			default: '',
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
		track_length: {
			type: String,
			default: '00:00:00',
		},
		qc_feedback: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
			required: true,
		},
	},
	{ timestamps: true }
);

// Verificar si el modelo ya existe antes de crear uno nuevo
const SingleTrack =
	mongoose.models.SingleTrack ||
	mongoose.model('SingleTrack', SingleTrackSchema);

export default SingleTrack;
