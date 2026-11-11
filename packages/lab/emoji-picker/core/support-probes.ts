import type { GridCatalog } from '#emoji-picker/core/catalog-types.ts';

export interface SupportProbe {
	emoji: string;
	version: number;
}

// The `u` flag makes `.` match one code point, so an astral glyph counts once
function isSingleCodePoint(glyph: string) {
	return /^.$/su.test(glyph.replaceAll('\u{FE0F}', ''));
}

// Prefers a lone code point, since a sequence that falls apart still draws in colour
export function supportProbes(catalog: GridCatalog): Array<SupportProbe> {
	const byVersion = new Map<number, string>();

	const entries = catalog.groups.flatMap((group) => group.emoji);

	for (const item of entries) {
		const current = byVersion.get(item.version);

		if (current === undefined || (!isSingleCodePoint(current) && isSingleCodePoint(item.emoji))) {
			byVersion.set(item.version, item.emoji);
		}
	}

	return [...byVersion]
		.map(([version, emoji]) => ({ emoji, version }))
		.sort((first, second) => second.version - first.version);
}
