export interface Sello {
	_id: string;
	name: string;
	email: string;
	password: string;
	role: 'sello';
	status: 'active' | 'inactive' | 'banned';
	tipo: 'principal' | 'subcuenta';
	company?: string;
	catalog_num: number;
	primary_genre?: string;
	year: number;
	contract_received: boolean;
	information_accepted: boolean;
	label_approved: boolean;
	picture?: string | File | { base64: string };
	assigned_artists?: string[];
	parentId?: string | null;
	parentName?: string | null;
	subaccounts?: Array<{ _id: string; name: string }>;
	createdAt?: string;
	updatedAt?: string;
	external_id?: number;
	artistLimit?: number;
	hasExtendedLimit?: boolean;
	limitExpirationDate?: Date;
	exclusivity?: 'exclusivo' | 'no_exclusivo';
}
