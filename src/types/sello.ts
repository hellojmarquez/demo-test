export interface Sello {
	_id: string;
	name: string;
	company?: string;
	catalog_num: number;
	primary_genre?: string;
	year: number;
	contract_received: boolean;
	information_accepted: boolean;
	label_approved: boolean;
	picture?: string;
	assigned_artists?: string[];
	status: 'active' | 'inactive';
	tipo: 'principal' | 'subcuenta';
	parentId?: string | null;
	parentName?: string | null;
	created_at?: string;
	updatedAt?: string;
	external_id?: number;
}
