export interface Artist {
	order: number;
	artist: number;
	kind: string;
	name: string;
}

export interface NewArtist {
	order: number;
	artist: number;
	kind: string;
	name: string;
	email: string;
	amazon_music_identifier: string;
	apple_identifier: string;
	deezer_identifier: string;
	spotify_identifier: string;
}

export interface Picture {
	full_size: string;
	thumb_medium: string;
	thumb_small: string;
}

export interface Release {
	name: string;
	picture: Picture | File | null;
	external_id?: number;
	auto_detect_language?: boolean;
	generate_ean?: boolean;
	backcatalog?: boolean;
	youtube_declaration?: boolean;
	dolby_atmos?: boolean;
	artists?: Artist[];
	newArtists?: NewArtist[];
	status?: string;
	tracks?: Array<{
		external_id?: string;
		order: number;
		title: string;
		artists: Artist[];
		ISRC: string;
		generate_isrc: boolean;
		DA_ISRC: string;
		genre: number;
		genre_name: string;
		subgenre: number;
		subgenre_name: string;
		mix_name: string;
		resource: string;
		dolby_atmos_resource: string;
		album_only: boolean;
		explicit_content: boolean;
		track_length: string;
	}>;
	newTracks?: Array<{
		title: string;
		mixName: string;
		order: number;
		resource: string | File;
		dolby_atmos_resource: string;
		ISRC: string;
		DA_ISRC: string;
		genre: number;
		genre_name: string;
		subgenre: number;
		subgenre_name: string;
		album_only: boolean;
		explicit_content: boolean;
		track_length: string;
		generate_isrc: boolean;
		artists: Artist[];
	}>;
	countries?: string[];
	catalogue_number: string;
	kind?: string;
	label?: number;
	label_name?: string;
	language: string;
	release_version?: string;
	publisher?: number;
	publisher_name: string;
	publisher_year?: string;
	copyright_holder?: string;
	copyright_holder_year?: string;
	genre?: number;
	genre_name?: string;
	subgenre?: number;
	subgenre_name?: string;
	artwork?: string;
	is_new_release?: number;
	official_date?: string;
	original_date?: string;
	exclusive_shop?: number;
	territory?: string;
	ean?: string;
	qc_feedback?: {};
	has_acr_alert?: boolean;
	acr_alert?: {} | null;
	release_user_declaration?: {} | null;
	createdAt?: string;
	updatedAt?: string;
	available?: boolean;
}

export interface ReleaseResponse {
	success: boolean;
	data: Release;
	message?: string;
}

export interface NewTrack {
	title: string;
	mixName: string;
	order: number;
	resource: string;
	dolby_atmos_resource: string;
	ISRC: string;
	DA_ISRC: string;
	genre: number;
	genre_name: string;
	subgenre: number;
	subgenre_name: string;
	album_only: boolean;
	explicit_content: boolean;
	track_length: string;
	generate_isrc: boolean;
	artists: Artist[];
}
