import mongoose, { Schema } from 'mongoose';

interface Artist {
	order: number;
	artist: number;
	kind: string;
}

interface Track {
	order: number;
	name: string;
	artists: Artist[];
	ISRC: string;
	generate_isrc: boolean;
	DA_ISRC: string;
	genre: number;
	subgenre: number;
	mix_name: string;
	resource: string | File | null;
	dolby_atmos_resource: string;
	album_only: boolean;
	explicit_content: boolean;
	track_length: string;
}

const artistSchema = new Schema<Artist>({
	order: { type: Number, required: true },
	artist: { type: Number, required: true },
	kind: { type: String, required: true },
});

const trackSchema = new Schema<Track>({
	order: { type: Number, required: true },
	name: { type: String, required: true },
	artists: { type: [artistSchema], required: true },
	ISRC: { type: String, required: true },
	generate_isrc: { type: Boolean, required: true },
	DA_ISRC: { type: String, required: true },
	genre: { type: Number, required: true },
	subgenre: { type: Number, required: true },
	mix_name: { type: String, required: true },
	resource: { type: String, required: true },
	dolby_atmos_resource: { type: String, required: true },
	album_only: { type: Boolean, required: true },
	explicit_content: { type: Boolean, required: true },
	track_length: { type: String, required: true },
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
		publisher: { type: String, required: false },
		publisher_year: { type: String, required: false },
		copyright_holder: { type: String, required: false },
		copyright_holder_year: { type: String, required: false },
		genre: { type: Number, required: false },
		subgenre: { type: Number, required: false },
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
