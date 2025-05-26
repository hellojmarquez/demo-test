export interface Artista {
	_id: string;
	external_id?: string | number;
	name: string;
	email: string;
	password?: string;
	picture?: string | File;
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
	role?: string;
	status?: string;
	[key: string]: any;
}
