export interface Track {
	_id?: string;
	external_id?: string | number;
	name: string;
	title?: string;
	mix_name?: string;
	DA_ISRC?: string;
	ISRC?: string;
	__v?: number;
	album_only: boolean;
	artists: Array<{
		artist: number;
		kind: string;
		order: number;
		name: string;
		isNew?: boolean;
	}>;
	contributors?: Array<{
		contributor: number;
		name: string;
		role: number;
		order: number;
		role_name: string;
	}>;
	copyright_holder?: string;
	copyright_holder_year?: string;
	createdAt?: string;
	dolby_atmos_resource?: File | string | null;
	explicit_content: boolean;
	generate_isrc: boolean;
	genre: number;
	genre_name: string;
	subgenre: number;
	subgenre_name: string;
	label_share?: string | number;
	language?: string;
	order?: number;
	publishers?: Array<{
		publisher: number;
		author: string;
		order: number;
		name: string;
	}>;
	release?: string | null;
	resource?: File | string | null;
	sample_start?: string;
	track_lenght?: string;
	track_length?: string;
	updatedAt?: string;
	vocals?: string;
	status?: string;
	qc_feedback?: any;
	newTracks?: Track[];
	available?: boolean;
}

export interface TrackResponse {
	success: boolean;
	data: Track | Track[];
	message?: string;
}
