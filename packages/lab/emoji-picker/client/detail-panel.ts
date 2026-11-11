import type { SearchEmoji } from '#emoji-picker/core/catalog-types.ts';

interface DetailParts {
	code: Element;
	glyph: Element;
	hint: HTMLElement;
	keywords: Element;
	name: Element;
	note: HTMLElement;
	shortcodes: Element;
}

export function queryDetailParts(root: Element): DetailParts | undefined {
	const code = root.querySelector(':scope .ep-detail-code');
	const glyph = root.querySelector(':scope .ep-detail-glyph');
	const hint = root.querySelector<HTMLElement>(':scope .ep-detail-hint');
	const keywords = root.querySelector(':scope .ep-detail-keywords');
	const name = root.querySelector(':scope .ep-detail-name');
	const note = root.querySelector<HTMLElement>(':scope .ep-detail-note');
	const shortcodes = root.querySelector(':scope .ep-detail-shortcodes');

	if (!code || !glyph || !hint || !keywords || !name || !note || !shortcodes) return undefined;

	return { code, glyph, hint, keywords, name, note, shortcodes };
}

function codePoints(glyph: string) {
	return Array.from(
		glyph,
		(character) =>
			`U+${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`,
	).join(' ');
}

// Keywords and shortcodes arrive with the search data; until then the panel shows what the grid holds
export function renderDetail(
	parts: DetailParts,
	cell: HTMLButtonElement,
	entry: SearchEmoji | undefined,
) {
	const glyph = cell.textContent;

	parts.glyph.textContent = glyph;
	parts.name.textContent = cell.getAttribute('aria-label') ?? '';
	parts.code.textContent = codePoints(glyph);
	parts.hint.hidden = cell.dataset.skins === undefined;
	parts.note.hidden = !cell.classList.contains('ep-unsupported');
	parts.keywords.textContent = entry ? [...entry.keywords, ...entry.community].join(', ') : '';
	parts.shortcodes.replaceChildren(
		...(entry?.shortcodes ?? []).map((shortcode) => {
			const item = document.createElement('li');

			item.textContent = `:${shortcode}:`;

			return item;
		}),
	);
}
