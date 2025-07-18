import mongoose, { Schema } from 'mongoose';

interface Artist {
	order: number;
	artist: number;
	kind: string;
	name: string;
}

interface Track {
	title: string;
	mixName: string;
	external_id: number;
	resource: string;
}

const artistSchema = new Schema<Artist>({
	order: { type: Number, required: true },
	artist: { type: Number, required: true },
	kind: { type: String, required: true },
	name: { type: String, required: true },
});
const trackSchema = new Schema<Track>({
	title: { type: String, required: true },
	mixName: { type: String, required: false },
	external_id: { type: Number, required: true },
	resource: { type: String, required: true },
});

const pictureSchema = new Schema({
	full_size: { type: String, required: true },
	thumb_medium: { type: String, required: true },
	thumb_small: { type: String, required: true },
});

const releaseSchema = new Schema(
	{
		picture: {
			type: pictureSchema,
			required: false,
		},
		external_id: { type: Number, required: false },
		auto_detect_language: { type: Boolean, required: false },
		generate_ean: { type: Boolean, required: false },
		backcatalog: { type: Boolean, required: false },
		youtube_declaration: { type: Boolean, required: true, default: true },
		dolby_atmos: { type: Boolean, required: false },
		artists: [artistSchema],
		has_acr_alert: { type: Boolean, required: true },
		acr_alert: { type: Object, required: false, default: null },
		release_user_declaration: { type: Object, required: false, default: null },
		ddex_delivery_confirmations: {
			type: Object,
			required: false,
			default: null,
		},
		status: { type: String, required: true, default: 'offline' },
		qc_feedback: { type: Object, required: false },
		tracks: { type: [trackSchema], required: false },
		countries: { type: [String], required: false },
		name: { type: String, required: true },
		catalogue_number: { type: String, required: true },
		kind: { type: String, required: false },
		label: { type: Number, required: false },
		label_name: { type: String, required: false },
		language: { type: String, required: false },
		release_version: { type: String, required: false },
		publisher: { type: Number, required: false },
		publisher_name: { type: String, required: false },
		publisher_year: { type: String, required: false },
		copyright_holder: { type: String, required: false },
		copyright_holder_year: { type: String, required: false },
		genre: { type: Number, required: false },
		genre_name: { type: String, required: false },
		subgenre: { type: Number, required: false },
		subgenre_name: { type: String, required: false },
		is_new_release: { type: Number, required: false },
		official_date: { type: String, required: false },
		original_date: { type: String, required: false },
		exclusive_shop: { type: Number, required: false },
		territory: { type: String, required: false },
		ean: { type: String, required: false },
		available: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

// Índices para búsquedas eficientes
releaseSchema.index({ 'artists.artist': 1 });
releaseSchema.index({ name: 1 });
releaseSchema.index({ external_id: 1 });

const Release =
	mongoose.models.Release || mongoose.model('Release', releaseSchema);

export default Release;
