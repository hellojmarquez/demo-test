export interface Publisher {
	_id: string;
	external_id?: number;
	name: string;
	email: string;
	password?: string;
	role: 'publisher';
	picture?: string;
	status: 'activo' | 'inactivo' | 'pendiente';
	isMainAccount: boolean;
	lastLogin?: Date;
	createdAt: Date;
	updatedAt: Date;

	// Campos específicos de publisher
	contract_received?: boolean;
	information_accepted?: boolean;
	publisher_approved?: boolean;
}
