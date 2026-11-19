export interface ToneState {
	tone: number;
	tones: Record<string, number>;
}

export function toneFor({ tone, tones }: ToneState, hexcode: string) {
	return tones[hexcode] ?? tone;
}

export function withEmojiTone({ tone, tones }: ToneState, hexcode: string, emojiTone: number) {
	const { [hexcode]: _previous, ...rest } = tones;

	return emojiTone === tone ? rest : { ...rest, [hexcode]: emojiTone };
}
