export interface Contributor {
	_id: string;
	external_id?: number;
	name: string;
	email: string;
	password?: string;
	role: 'contributor';
	picture?: string;
	status: 'activo' | 'inactivo' | 'pendiente';
	isMainAccount: boolean;
	lastLogin?: Date;
	createdAt: Date;
	updatedAt: Date;

	// Campos específicos de contributor
	contract_received?: boolean;
	information_accepted?: boolean;
	contributor_approved?: boolean;
}
