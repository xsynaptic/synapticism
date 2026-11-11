import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

import { addRecent } from '#emoji-picker/core/recents.ts';
import { emojiSizes, recentsLimit, storageKey } from '#emoji-picker/emoji-picker-constants.ts';

export type EmojiSize = (typeof emojiSizes)[number];

// Hexcodes rather than glyphs, so a data update can remap them
interface PersistedState {
	recents: Array<string>;
	size: EmojiSize;
	tones: Record<string, number>;
}

interface PickerState extends PersistedState {
	addRecent: (hexcode: string) => void;
	setSize: (size: EmojiSize) => void;
	setTone: (hexcode: string, tone: number) => void;
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
			recents: [],
			setSize: (size) => {
				set({ size });
			},
			setTone: (hexcode, tone) => {
				set((state) => ({ tones: { ...state.tones, [hexcode]: tone } }));
			},
			size: 'small',
			supportedVersion: Infinity,
			tones: {},
		}),
		{
			name: storageKey,
			partialize: (state): PersistedState => ({
				recents: state.recents,
				size: state.size,
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
