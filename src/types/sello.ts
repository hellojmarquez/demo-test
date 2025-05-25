export interface Sello {
	_id: string;
	name: string;
	email: string;
	password?: string;
	role: string;
	picture?: string | { base64: string };
	catalog_num?: number;
	year?: number;
	status?: 'activo' | 'inactivo' | 'banneado';
	contract_received?: boolean;
	information_accepted?: boolean;
	label_approved?: boolean;
	assigned_artists?: string[];
	createdAt?: string;
	updatedAt?: string;
	exclusivity?: 'exclusivo' | 'no_exclusivo';
	tipo?: 'principal' | 'subcuenta';
	parentId?: string | null;
	parentName?: string | null;
	subaccounts?: Array<{
		_id: string;
		name: string;
	}>;
	fecha_inicio?: string;
	fecha_fin?: string;
}
