export interface Track {
	_id: string;
	name: string;
	mix_name?: string;
	DA_ISRC?: string;
	ISRC?: string;
	__v: number;
	album_only: boolean;
	artists: Array<{
		artist: number;
		kind: string;
		order: number;
		name: string;
	}>;
	contributors: Array<{
		contributor: number;
		name: string;
		role: number;
		order: number;
		role_name: string;
	}>;
	copyright_holder?: string;
	copyright_holder_year?: string;
	createdAt: string;
	dolby_atmos_resource?: string;
	explicit_content: boolean;
	generate_isrc: boolean;
	genre?: {
		id: number;
		name: string;
	};
	subgenre?: {
		id: number;
		name: string;
	};
	label_share?: number;
	language?: string;
	order?: number;
	publishers: Array<{
		publisher: number;
		author: string;
		order: number;
	}>;
	release?: string;
	resource?: File | string | null;
	sample_start?: string;
	track_lenght?: string;
	updatedAt: string;
	vocals?: string;
}

export interface TrackResponse {
	success: boolean;
	data: Track | Track[];
	message?: string;
}
