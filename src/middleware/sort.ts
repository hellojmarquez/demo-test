import { NextRequest } from 'next/server';

export type SortOrder = 1 | -1;

export interface SortOptions {
	[key: string]: { [key: string]: SortOrder };
}

export const sortMiddleware = (
	req: NextRequest,
	options: SortOptions,
	defaultSort: string = 'newest'
) => {
	const { searchParams } = new URL(req.url);
	const sort = searchParams.get('sort') || defaultSort;
	return options[sort] || options[defaultSort];
};
