import { describe, expect, test } from 'vitest';

import { stripMdxComponents, textClipper } from '#lib/utils/text.ts';

describe('textClipper', () => {
	test('returns input untouched at exactly the word count', () => {
		expect(textClipper('one two three', { wordCount: 3 })).toBe('one two three');
	});

	test('clips at the word count and appends the default trailer', () => {
		expect(textClipper('The quick brown fox jumps over the lazy dog', { wordCount: 4 })).toBe(
			'The quick brown fox...',
		);
	});

	test('supports a custom trailer', () => {
		expect(textClipper('one two three four', { trailer: '…', wordCount: 2 })).toBe('one two…');
	});
});

describe('stripMdxComponents', () => {
	test('strips the named tags, paired and self-closing', () => {
		expect(stripMdxComponents('One <Img src="a.jpg" /> two <More />three', ['Img', 'More'])).toBe(
			'One  two three',
		);
	});

	test('leaves a component whose name merely starts with a stripped name', () => {
		expect(stripMdxComponents('a <ImgGroup cols={2}>x</ImgGroup> b', ['Img'])).toBe(
			'a <ImgGroup cols={2}>x</ImgGroup> b',
		);
	});
});
