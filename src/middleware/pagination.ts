import { NextRequest } from 'next/server';

export interface PaginationResult {
	page: number;
	limit: number;
	skip: number;
}

export const paginationMiddleware = (req: NextRequest): PaginationResult => {
	const { searchParams } = new URL(req.url);
	const page = parseInt(searchParams.get('page') || '1');
	const limit = parseInt(searchParams.get('limit') || '5');
	return {
		page,
		limit,
		skip: (page - 1) * limit,
	};
};
