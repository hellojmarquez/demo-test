import { NextRequest } from 'next/server';

export const searchMiddleware = (
	req: NextRequest,
	searchField: string = 'name'
) => {
	const { searchParams } = new URL(req.url);
	const search = searchParams.get('search') || '';
	return search ? { [searchField]: { $regex: search, $options: 'i' } } : {};
};
