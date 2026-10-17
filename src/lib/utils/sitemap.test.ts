import { describe, expect, test } from 'vitest';

import { getUrlPathIndexing } from '#lib/utils/sitemap.ts';

describe('getUrlPathIndexing', () => {
	test('indexes and follows an ordinary content path', () => {
		expect(getUrlPathIndexing('/posts/some-post/')).toStrictEqual({ follow: true, index: true });
		expect(getUrlPathIndexing('/notes/some-note')).toStrictEqual({ follow: true, index: true });
	});

	test('follows but does not index paginated routes', () => {
		expect(getUrlPathIndexing('/posts/2/')).toStrictEqual({ follow: true, index: false });
		expect(getUrlPathIndexing('/notes/3')).toStrictEqual({ follow: true, index: false });
		expect(getUrlPathIndexing('/page/2/')).toStrictEqual({ follow: true, index: false });
	});

	test('indexes a slug ending in a number', () => {
		expect(getUrlPathIndexing('/posts/web-3/').index).toBe(true);
	});

	test('neither indexes nor follows an excluded prefix, bare and with a child path', () => {
		for (const pathname of ['/about/cv', '/about/cv/', '/about/cv/print/', '/about/cv/2/']) {
			expect(getUrlPathIndexing(pathname)).toStrictEqual({ follow: false, index: false });
		}
	});

	test('indexes a path that merely looks like an excluded prefix', () => {
		expect(getUrlPathIndexing('/about/cv-archive/').index).toBe(true);
	});
});
