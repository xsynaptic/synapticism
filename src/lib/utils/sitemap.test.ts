import { describe, expect, test } from 'vitest';

import { isIndexableUrlPath } from '#lib/utils/sitemap.ts';

describe('isIndexableUrlPath', () => {
	test('accepts an ordinary content path', () => {
		expect(isIndexableUrlPath('/posts/some-post/')).toBe(true);
		expect(isIndexableUrlPath('/notes/some-note')).toBe(true);
	});

	test('rejects paginated routes', () => {
		expect(isIndexableUrlPath('/posts/2/')).toBe(false);
		expect(isIndexableUrlPath('/notes/3')).toBe(false);
	});

	test('accepts a slug ending in a number', () => {
		expect(isIndexableUrlPath('/posts/web-3/')).toBe(true);
	});

	test('rejects an excluded prefix, bare and with a child path', () => {
		expect(isIndexableUrlPath('/about/cv')).toBe(false);
		expect(isIndexableUrlPath('/about/cv/')).toBe(false);
		expect(isIndexableUrlPath('/about/cv/print/')).toBe(false);
	});

	test('accepts a path that merely looks like an excluded prefix', () => {
		expect(isIndexableUrlPath('/about/cv-archive/')).toBe(true);
	});
});
