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
	createdAt: string;
	updatedAt: string;
	role: string;
	status: string;
	permissions: string[];
	_id: string;
	__v: number;
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
}

export interface ITokenUser {
	name: string;
	email: string;
	picture: string;
	subaccounts: string[];
	createdAt: string;
	updatedAt: string;
	role: string;
	status: string;
	permissions: string[];
	_id: string;
	__v: number;
	amazon_music_identifier?: string;
	apple_identifier?: string;
	deezer_identifier?: string;
	spotify_identifier?: string;
}

export interface ISession {
	user: ITokenUser;
	iat: number;
	exp: number;
}
