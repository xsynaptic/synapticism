import { describe, expect, test } from 'vitest';

import { extractImageFeaturedIds, extractMdxImageIds } from './images.js';

describe('extractMdxImageIds', () => {
	test('reads the src of every Img in document order', () => {
		const body = ['<Img src="notes/diagram.jpg" />', '<Img src="notes/screen.png">A caption</Img>'];

		expect(extractMdxImageIds(body.join('\n'))).toEqual(['notes/diagram.jpg', 'notes/screen.png']);
	});

	test('does not read `data-src` as the `src` prop', () => {
		expect(extractMdxImageIds('<Img data-src="decoy.jpg" src="notes/diagram.jpg" />')).toEqual([
			'notes/diagram.jpg',
		]);
	});

	test('skips ImgGroup, which is a different component', () => {
		expect(extractMdxImageIds('<ImgGroup src="notes/diagram.jpg" />')).toEqual([]);
	});

	test('reads a single-quoted value', () => {
		expect(extractMdxImageIds("<Img src='notes/diagram.jpg' />")).toEqual(['notes/diagram.jpg']);
	});

	test('skips an Img with no src', () => {
		expect(extractMdxImageIds('<Img alt="A diagram" />')).toEqual([]);
	});
});

describe('extractImageFeaturedIds', () => {
	test('reads a bare string', () => {
		expect(extractImageFeaturedIds({ imageFeatured: 'notes/diagram.jpg' })).toEqual([
			'notes/diagram.jpg',
		]);
	});

	test('reads an array mixing strings and objects', () => {
		const data = { imageFeatured: ['notes/diagram.jpg', { id: 'notes/screen.png' }] };

		expect(extractImageFeaturedIds(data)).toEqual(['notes/diagram.jpg', 'notes/screen.png']);
	});

	test('skips an array item carrying no id', () => {
		// eslint-disable-next-line unicorn/no-null -- an empty YAML list item parses to `null`
		const data = { imageFeatured: [{ alt: 'A diagram' }, null, { id: 'notes/screen.png' }] };

		expect(extractImageFeaturedIds(data)).toEqual(['notes/screen.png']);
	});

	test('is empty when the field is absent', () => {
		expect(extractImageFeaturedIds({})).toEqual([]);
	});
});
