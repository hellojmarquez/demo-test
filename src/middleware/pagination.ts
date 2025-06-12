import { NextRequest } from 'next/server';

export interface PaginationResult {
	page: number;
	limit: number;
	skip: number;
}

export const paginationMiddleware = (req: NextRequest): PaginationResult => {
	const { searchParams } = new URL(req.url);
	const getAll = searchParams.get('all') === 'true';

	if (getAll) {
		return {
			page: 1,
			limit: 0, // 0 significa sin límite en MongoDB
			skip: 0,
		};
	}

	const page = parseInt(searchParams.get('page') || '1');
	const limit = parseInt(searchParams.get('limit') || '5');
	return {
		page,
		limit,
		skip: (page - 1) * limit,
	};
};
