export const storageKey = 'syn-emoji-picker';

export const recentsRows = 4;

// Four rows at the widest grid's 16 columns
export const recentsLimit = recentsRows * 16;

export const emojiSizes = ['small', 'large'] as const;

export const emojiSizeLabels = {
	large: 'Large emoji',
	small: 'Small emoji',
} as const satisfies Record<(typeof emojiSizes)[number], string>;
