export interface Track {
	_id: string;
	name: string;
	mix_name: string;
	DA_ISRC: string;
	ISRC: string;
	__v: number;
	album_only: boolean;
	artists: { artist: number; kind: string; order: number; name: string }[];
	contributors: {
		contributor: number;
		name: string;
		role: number;
		order: number;
		role_name: string;
	}[];
	copyright_holder: string;
	copyright_holder_year: string;
	createdAt: string;
	dolby_atmos_resource: string;
	explicit_content: boolean;
	generate_isrc: boolean;
	genre: {
		id: number;
		name: string;
	};
	subgenre: {
		id: number;
		name: string;
	};
	label_share: number | null;
	language: string;
	order: number | null;
	publishers: { publisher: number; author: string; order: number }[];
	release: string;
	resource: string | File | null;
	sample_start: string;
	track_lenght: string | null;
	updatedAt: string;
	vocals: string;
}
