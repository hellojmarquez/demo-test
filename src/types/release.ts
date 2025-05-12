export interface Artist {
	order: number;
	artist: number;
	kind: string;
	name: string;
}

export interface Release {
	_id: string;
	name: string;
	picture?: string;
	external_id?: number;
	auto_detect_language?: boolean;
	generate_ean?: boolean;
	backcatalog?: boolean;
	youtube_declaration?: boolean;
	dolby_atmos?: boolean;
	artists?: Artist[];
	tracks?: Array<{
		order: number;
		title: string;
		artists: Artist[];
		ISRC: string;
		generate_isrc: boolean;
		DA_ISRC: string;
		genre: number;
		subgenre: number;
		mix_name: string;
		resource: string;
		dolby_atmos_resource: string;
		album_only: boolean;
		explicit_content: boolean;
		track_length: string;
	}>;
	countries?: string[];
	catalogue_number: string;
	kind?: string;
	label?: number;
	label_name?: string;
	language?: string;
	release_version?: string;
	publisher?: string;
	publisher_year?: string;
	copyright_holder?: string;
	copyright_holder_year?: string;
	genre?: number;
	subgenre?: number;
	artwork?: string;
	is_new_release?: number;
	official_date?: string;
	original_date?: string;
	exclusive_shop?: number;
	territory?: string;
	ean?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface ReleaseResponse {
	success: boolean;
	data: Release;
	message?: string;
}
