export interface Artista {
	_id: string;
	external_id?: number;
	name: string;
	email: string;
	password?: string;
	role: 'artista';
	picture?: string | File;
	status: 'activo' | 'inactivo' | 'banneado';
	isMainAccount: boolean;
	lastLogin?: Date;
	createdAt: Date;
	updatedAt: Date;

	// Campos específicos de artista
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
}
