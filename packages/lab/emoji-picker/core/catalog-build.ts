import type { Emoji, GroupMessage, ShortcodesDataset } from 'emojibase';

import { parse } from 'yaml';
import { z } from 'zod';

import type {
	GridCatalog,
	GridEmoji,
	SearchCatalog,
	SearchEmoji,
} from '#emoji-picker/core/catalog-types.ts';

const overridesSchema = z.record(
	z.string(),
	z.strictObject({
		add: z.array(z.string()).optional(),
		remove: z.array(z.string()).optional(),
	}),
);

type Overrides = z.infer<typeof overridesSchema>;

type Override = Overrides[string];

export interface CatalogSources {
	community: Record<string, Array<string>>;
	emoji: Array<Emoji>;
	groups: Array<GroupMessage>;
	overrides: Overrides;
	shortcodes: Array<ShortcodesDataset>;
}

// The bare skin tone and hair swatches only make sense inside a sequence
const hiddenGroup = 'component';

export function parseOverrides(source: string): Overrides {
	return overridesSchema.parse(parse(source) ?? {});
}

// Emojilib and hand-written overrides vary on FE0F; emojibase's glyph is fully qualified
function stripVariation(glyph: string) {
	return glyph.replaceAll('\u{FE0F}', '');
}

function normalizeWord(word: string) {
	return word.trim().toLowerCase();
}

// Emojilib writes names as snake case; a word a higher layer already holds adds bytes but no matches
function splitWords(phrases: Array<string>) {
	return phrases.flatMap((phrase) => normalizeWord(phrase).split(/[\s_]+/)).filter(Boolean);
}

function toArray(value: Array<string> | string | undefined) {
	if (value === undefined) return [];

	return Array.isArray(value) ? value : [value];
}

function unique(words: Array<string>) {
	return [...new Set(words)];
}

function resolveOverrides(overrides: Overrides, entries: Array<Emoji>) {
	const hexcodeByGlyph = new Map(
		entries.map((entry) => [stripVariation(entry.emoji), entry.hexcode]),
	);
	const resolved = new Map<string, Override>();
	const unknown: Array<string> = [];

	for (const [glyph, override] of Object.entries(overrides)) {
		const hexcode = hexcodeByGlyph.get(stripVariation(glyph));

		if (hexcode === undefined) {
			unknown.push(glyph);
			continue;
		}

		resolved.set(hexcode, override);
	}

	if (unknown.length > 0) {
		throw new Error(`Overrides name emoji the catalog does not list: ${unknown.join(' ')}`);
	}

	return resolved;
}

function searchEntry(
	entry: Emoji,
	override: Override | undefined,
	sources: Pick<CatalogSources, 'shortcodes'> & { community: Map<string, Array<string>> },
): SearchEmoji {
	const removed = new Set((override?.remove ?? []).map((word) => normalizeWord(word)));

	function keep(words: Array<string>) {
		return unique(words.map((word) => normalizeWord(word))).filter((word) => !removed.has(word));
	}

	const additions = (override?.add ?? []).map((word) => normalizeWord(word));
	const keywords = unique([...keep(entry.tags ?? []), ...additions]);
	const covered = new Set(splitWords([entry.label, ...keywords]));
	const community = sources.community.get(stripVariation(entry.emoji)) ?? [];

	return {
		community: keep(splitWords(community)).filter((word) => !covered.has(word)),
		hexcode: entry.hexcode,
		keywords,
		label: entry.label,
		shortcodes: keep(sources.shortcodes.flatMap((preset) => toArray(preset[entry.hexcode]))),
	};
}

function gridEntry(entry: Emoji): GridEmoji {
	const result: GridEmoji = {
		emoji: entry.emoji,
		hexcode: entry.hexcode,
		label: entry.label,
		version: entry.version,
	};
	const uniformSkins = (entry.skins ?? []).filter((skin) => typeof skin.tone === 'number');

	if (uniformSkins.length === 0) return result;

	result.skins = uniformSkins.map((skin) => skin.emoji);

	const skinVersion = Math.max(...uniformSkins.map((skin) => skin.version));

	if (skinVersion > entry.version) result.skinVersion = skinVersion;

	return result;
}

// Shortcodes are already in `search`, so the client derives their lookup; only emoticons ship apart
function buildEmoticons(entries: Array<Emoji>) {
	const emoticons = new Map<string, string>();

	for (const entry of entries) {
		for (const emoticon of toArray(entry.emoticon)) {
			if (!emoticons.has(emoticon)) emoticons.set(emoticon, entry.hexcode);
		}
	}

	return Object.fromEntries(emoticons);
}

export function buildCatalog(sources: CatalogSources): {
	grid: GridCatalog;
	search: SearchCatalog;
} {
	const groups = sources.groups
		.filter((group) => group.key !== hiddenGroup)
		.sort((first, second) => first.order - second.order);
	const listedGroups = new Set(groups.map((group) => group.order));
	const entries = sources.emoji
		.filter((entry) => entry.group !== undefined && listedGroups.has(entry.group))
		.sort((first, second) => (first.order ?? 0) - (second.order ?? 0));
	const overrides = resolveOverrides(sources.overrides, entries);
	const community = new Map(
		Object.entries(sources.community).map(([glyph, words]) => [stripVariation(glyph), words]),
	);
	const search = entries.map((entry) =>
		searchEntry(entry, overrides.get(entry.hexcode), {
			community,
			shortcodes: sources.shortcodes,
		}),
	);

	return {
		grid: {
			groups: groups.map((group) => ({
				emoji: entries
					.filter((entry) => entry.group === group.order)
					.map((entry) => gridEntry(entry)),
				key: group.key,
				label: group.message.charAt(0).toUpperCase() + group.message.slice(1),
			})),
		},
		search: { emoji: search, emoticons: buildEmoticons(entries) },
	};
}
