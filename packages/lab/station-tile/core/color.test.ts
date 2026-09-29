import { describe, expect, it } from 'vitest';

import { parseHex } from '#station-tile/core/color.ts';

describe('parseHex', () => {
	it('expands shorthand to the same colour as the full form', () => {
		expect(parseHex('#3a7')).toEqual({ b: 0x77, g: 0xaa, r: 0x33 });
		expect(parseHex('3A7')).toEqual(parseHex('#33aa77'));
	});

	it.each(['', '#12345', '#1234567', '#ggg', '#12345g', 'teal'])('throws on %j', (input) => {
		expect(() => parseHex(input)).toThrow('Invalid hex color');
	});
});
