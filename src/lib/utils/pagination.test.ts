import type { Page } from 'astro';

import { describe, expect, test } from 'vitest';

import { getPagePagination, getPagination } from '#lib/utils/pagination.ts';
import { getHomePaginationPath } from '#lib/utils/routing.ts';

function getUrl(pageNumber: number, trailingSlash: string) {
	return pageNumber === 1
		? `/notes${trailingSlash}`
		: `/notes/${String(pageNumber)}${trailingSlash}`;
}

function makePage(currentPage: number, lastPage: number, trailingSlash: string): Page {
	return {
		currentPage,
		data: [],
		end: 9,
		lastPage,
		size: 10,
		start: 0,
		total: lastPage * 10,
		url: {
			current: getUrl(currentPage, trailingSlash),
			first: currentPage === 1 ? undefined : getUrl(1, trailingSlash),
			last: currentPage === lastPage ? undefined : getUrl(lastPage, trailingSlash),
			next: currentPage === lastPage ? undefined : getUrl(currentPage + 1, trailingSlash),
			prev: currentPage === 1 ? undefined : getUrl(currentPage - 1, trailingSlash),
		},
	};
}

describe.each([
	{ shape: 'bare, as Astro paginates by default', trailingSlash: '' },
	{ shape: 'slashed', trailingSlash: '/' },
])('getPagePagination with $shape urls', ({ trailingSlash }) => {
	test('page 1 normalizes every option to the trailing-slash form', () => {
		const pagination = getPagePagination(makePage(1, 3, trailingSlash));

		expect(pagination.options.at(0)?.url).toBe('/notes/');
		expect(pagination.options.at(2)?.url).toBe('/notes/3/');
		expect(pagination.previous).toBeUndefined();
		expect(pagination.next?.url).toBe('/notes/2/');
	});

	test('a middle page marks only itself current and links back to the unnumbered first page', () => {
		const pagination = getPagePagination(makePage(2, 3, trailingSlash));

		expect(
			pagination.options.filter((option) => option.isCurrent).map((option) => option.url),
		).toStrictEqual(['/notes/2/']);
		expect(pagination.previous?.url).toBe('/notes/');
	});
});

describe('getPagination for the homepage', () => {
	test('page 2 links back to the homepage and on under /page/', () => {
		const pagination = getPagination({
			currentPage: 2,
			getPageUrl: getHomePaginationPath,
			lastPage: 3,
		});

		expect(pagination.previous?.url).toBe('/');
		expect(pagination.next?.url).toBe('/page/3/');
		expect(pagination.options.map((option) => option.url)).toStrictEqual([
			'/',
			'/page/2/',
			'/page/3/',
		]);
	});

	test('the last page has no next link', () => {
		const pagination = getPagination({
			currentPage: 3,
			getPageUrl: getHomePaginationPath,
			lastPage: 3,
		});

		expect(pagination.next).toBeUndefined();
	});
});
