import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

import { addRecent } from '#emoji-picker/core/recents.ts';
import { withEmojiTone } from '#emoji-picker/core/tones.ts';
import { emojiSizes, recentsLimit, storageKey } from '#emoji-picker/emoji-picker-constants.ts';

export type EmojiSize = (typeof emojiSizes)[number];

// Hexcodes rather than glyphs, so a data update can remap them
interface PersistedState {
	recents: Array<string>;
	size: EmojiSize;
	supportedVersion?: number;
	tone: number;
	tones: Record<string, number>;
}

export interface PickerState extends PersistedState {
	addRecent: (hexcode: string) => void;
	clearRecents: () => void;
	setEmojiTone: (hexcode: string, tone: number) => void;
	setGlobalTone: (tone: number) => void;
	setSize: (size: EmojiSize) => void;
	supportedVersion: number;
}

export function isEmojiSize(value: string | undefined): value is EmojiSize {
	return emojiSizes.some((size) => size === value);
}

export const pickerStore = createStore<PickerState>()(
	persist(
		(set) => ({
			addRecent: (hexcode) => {
				set((state) => ({ recents: addRecent(state.recents, hexcode, recentsLimit) }));
			},
			clearRecents: () => {
				set({ recents: [] });
			},
			recents: [],
			setEmojiTone: (hexcode, tone) => {
				set((state) => ({ tones: withEmojiTone(state, hexcode, tone) }));
			},
			setGlobalTone: (tone) => {
				set({ tone, tones: {} });
			},
			setSize: (size) => {
				set({ size });
			},
			size: 'small',
			supportedVersion: Infinity,
			tone: 0,
			tones: {},
		}),
		{
			name: storageKey,
			// JSON turns Infinity into null, which would dim everything
			partialize: (state): PersistedState => ({
				recents: state.recents,
				size: state.size,
				...(Number.isFinite(state.supportedVersion)
					? { supportedVersion: state.supportedVersion }
					: {}),
				tone: state.tone,
				tones: state.tones,
			}),
			storage: createJSONStorage(() => localStorage),
			version: 1,
		},
	),
);

globalThis.addEventListener('storage', (event) => {
	if (event.key === storageKey) void pickerStore.persist.rehydrate();
});
