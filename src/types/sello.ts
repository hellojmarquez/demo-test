export interface Sello {
	_id: string;
	assigned_artists: string[];
	catalog_num: number;
	contract_received: boolean;
	created_at: string;
	information_accepted: boolean;
	label_approved: boolean;
	name: string;
	picture?: { base64: string };
	status: string;
	updatedAt: string;
	year: number;
}
