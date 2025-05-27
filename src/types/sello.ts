export interface Sello {
	_id: string;
	external_id: number;
	name: string;
	email: string;
	password?: string;
	role: 'sello';
	picture?: string;
	status: 'activo' | 'inactivo' | 'pendiente';
	isMainAccount: boolean;
	lastLogin?: Date;
	createdAt: Date;
	updatedAt: Date;

	// Campos específicos de sello
	artistLimit: number;
	hasExtendedLimit: boolean;
	limitExpirationDate?: Date;
	catalog_num?: number;
	year?: number;
	primary_genre?: string;
	contract_received?: boolean;
	information_accepted?: boolean;
	label_approved?: boolean;
	exclusivity?: 'exclusivo' | 'no_exclusivo';
}
