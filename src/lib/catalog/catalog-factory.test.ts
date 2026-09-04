import { describe, expect, test } from 'vitest';

import type { CatalogItem } from '#lib/catalog/catalog-types.ts';

import { createCatalog } from '#lib/catalog/catalog-factory.ts';
import { makeCatalogItem } from '#lib/catalog/catalog-test-utils.ts';
import { filterIsEditorialEntry, sortCatalogByDate } from '#lib/catalog/catalog-utils.ts';

const ids = (items: ReadonlyArray<CatalogItem>) => items.map((item) => item.id);

describe('byCollection', () => {
	const catalog = createCatalog([
		makeCatalogItem({ collection: 'posts', id: 'a' }),
		makeCatalogItem({ collection: 'tags', id: 'b' }),
		makeCatalogItem({ collection: 'posts', id: 'c' }),
	]);

	test('returns items from the named collections in source order', () => {
		expect(ids(catalog.byCollection('posts'))).toEqual(['a', 'c']);
		expect(ids(catalog.byCollection('posts', 'tags'))).toEqual(['a', 'b', 'c']);
	});
});

describe('sortCatalogByDate', () => {
	test('is newest first, preferring dateUpdated over dateCreated', () => {
		const newer = makeCatalogItem({
			collection: 'posts',
			dateCreated: new Date(2024, 0, 1),
			id: 'newer',
		});
		const older = makeCatalogItem({
			collection: 'posts',
			dateCreated: new Date(2021, 0, 1),
			id: 'older',
		});
		const updatedRecently = makeCatalogItem({
			collection: 'posts',
			dateCreated: new Date(2019, 0, 1),
			dateUpdated: new Date(2025, 0, 1),
			id: 'updated-recently',
		});

		expect(ids([older, newer, updatedRecently].sort(sortCatalogByDate))).toEqual([
			'updated-recently',
			'newer',
			'older',
		]);
	});
});

describe('lookups', () => {
	const catalog = createCatalog([
		makeCatalogItem({ collection: 'posts', id: 'a', title: 'Post A' }),
	]);

	test('getCaption projects the caption shape, undefined on miss', () => {
		expect(catalog.getCaption('a')).toEqual({ id: 'a', title: 'Post A', url: '/a' });
		expect(catalog.getCaption('nope')).toBeUndefined();
	});

	test('resolve returns items in entry order, throws on miss with the id', () => {
		expect(ids(catalog.resolve([{ collection: 'posts', id: 'a' }] as never))).toEqual(['a']);
		expect(() => catalog.resolve([{ collection: 'posts', id: 'gone' }] as never)).toThrow(/gone/);
	});
});

describe('backlinksOf', () => {
	const catalog = createCatalog([
		makeCatalogItem({
			backlinks: new Set(['linker-note', 'linker-tag']),
			collection: 'posts',
			id: 'target',
		}),
		makeCatalogItem({
			collection: 'notes',
			dateCreated: new Date(2023, 0, 1),
			id: 'linker-note',
		}),
		makeCatalogItem({ collection: 'tags', id: 'linker-tag' }),
	]);

	test('returns every inbound link, uncapped and unfiltered, newest first', () => {
		expect(ids(catalog.backlinksOf('target'))).toEqual(['linker-note', 'linker-tag']);
	});

	test('leaves narrowing to the caller', () => {
		expect(ids(catalog.backlinksOf('target').filter(filterIsEditorialEntry))).toEqual([
			'linker-note',
		]);
	});

	test('returns an empty array for an unknown or backlink-free id', () => {
		expect(catalog.backlinksOf('nope')).toEqual([]);
		expect(catalog.backlinksOf('linker-note')).toEqual([]);
	});
});
