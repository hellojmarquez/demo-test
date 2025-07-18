export interface ICreateUser {
	name: string;
	email: string;
	password: string;
	picture?: string;
}

export interface IUser {
	name: string;
	email: string;
	password: string;
	picture: string;
	subaccounts: string[];
	parentId?: string;
	createdAt: string;
	updatedAt: string;
	role: string;
	tipo: 'principal' | 'subcuenta';
	status: string;
	permissions: string[];
	_id: string;
	__v: number;
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
	primary_genre?: string;
	year?: number;
	catalog_num?: number;
}

export interface ITokenUser {
	name: string;
	email: string;
	picture: string;
	subaccounts: string[];
	parentId?: string;
	createdAt: string;
	updatedAt: string;
	role: string;
	tipo: 'principal' | 'subcuenta';
	status: string;
	permissions: string[];
	_id: string;
	__v: number;
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
	primary_genre?: string;
	year?: number;
	catalog_num?: number;
}

export interface ISession {
	user: ITokenUser;
	iat: number;
	exp: number;
}
