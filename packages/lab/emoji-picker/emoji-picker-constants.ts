export const storageKey = 'syn-emoji-picker';

export const recentsLimit = 36;

export const emojiSizes = ['small', 'large'] as const;

export const emojiSizeLabels = {
	large: 'Large emoji',
	small: 'Small emoji',
} as const satisfies Record<(typeof emojiSizes)[number], string>;
