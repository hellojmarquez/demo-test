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
		external_id: { type: Number, required: true },
		auto_detect_language: { type: Boolean, required: true },
		generate_ean: { type: Boolean, required: true },
		backcatalog: { type: Boolean, required: true },
		youtube_declaration: { type: Boolean, required: true },
		dolby_atmos: { type: Boolean, required: true },
		artists: { type: [Schema.Types.Mixed], required: true },
		tracks: { type: [trackSchema], required: true },
		countries: { type: [String], required: true },
		name: { type: String, required: true },
		kind: { type: String, required: true },
		label: { type: Number, required: true },
		label_name: { type: String, required: true },
		language: { type: String, required: true },
	},
	{ timestamps: true }
);

// ✅ Aquí está la corrección
const Release =
	mongoose.models.Release || mongoose.model('Release', releaseSchema);

export default Release;
