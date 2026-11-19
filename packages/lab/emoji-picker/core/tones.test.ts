import { describe, expect, it } from 'vitest';

import { toneFor, withEmojiTone } from '#emoji-picker/core/tones.ts';

describe('toneFor', () => {
	it('prefers a per-emoji override, even the default yellow, over the global tone', () => {
		expect(toneFor({ tone: 3, tones: { '1F44D': 0 } }, '1F44D')).toBe(0);
	});

	it('falls back to the global tone', () => {
		expect(toneFor({ tone: 3, tones: { '1F44D': 5 } }, '1F44B')).toBe(3);
	});
});

describe('withEmojiTone', () => {
	it('stores a tone that differs from the global one', () => {
		expect(withEmojiTone({ tone: 3, tones: {} }, '1F44D', 5)).toEqual({ '1F44D': 5 });
	});

	it('drops the override when the choice matches the global tone', () => {
		expect(withEmojiTone({ tone: 3, tones: { '1F44B': 1, '1F44D': 5 } }, '1F44D', 3)).toEqual({
			'1F44B': 1,
		});
	});
});
