import mongoose, { Schema } from 'mongoose';

interface Artist {
	order: number;
	artist: number;
	kind: string;
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
});
const trackSchema = new Schema<Track>({
	title: { type: String, required: true },
	mixName: { type: String, required: false },
	external_id: { type: Number, required: true },
	resource: { type: String, required: true },
});

const releaseSchema = new Schema(
	{
		picture: { type: String, required: true, default: '/cd_cover.png' },
		external_id: { type: Number, required: false },
		auto_detect_language: { type: Boolean, required: false },
		generate_ean: { type: Boolean, required: false },
		backcatalog: { type: Boolean, required: false },
		youtube_declaration: { type: Boolean, required: false },
		dolby_atmos: { type: Boolean, required: false },
		artists: { type: [Schema.Types.Mixed], required: false },
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
		artwork: { type: String, required: false },
		is_new_release: { type: Number, required: false },
		official_date: { type: String, required: false },
		original_date: { type: String, required: false },
		exclusive_shop: { type: Number, required: false },
		territory: { type: String, required: false },
		ean: { type: String, required: false },
	},
	{ timestamps: true }
);

// ✅ Aquí está la corrección
const Release =
	mongoose.models.Release || mongoose.model('Release', releaseSchema);

export default Release;
