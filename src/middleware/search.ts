import { NextRequest } from 'next/server';
import { FilterQuery } from 'mongoose';

export const searchMiddleware = (
	req: NextRequest,
	searchField: string = 'name'
): FilterQuery<any> => {
	const { searchParams } = new URL(req.url);
	const search = searchParams.get('search') || '';
	return search ? { [searchField]: { $regex: search, $options: 'i' } } : {};
};
