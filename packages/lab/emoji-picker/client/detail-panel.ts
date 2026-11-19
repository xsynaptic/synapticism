import { versionShown } from '#emoji-picker/client/support-marking.ts';

interface DetailParts {
	glyph: Element;
	hint: HTMLElement;
	name: Element;
	note: HTMLElement;
}

export function queryDetailParts(root: Element): DetailParts | undefined {
	const glyph = root.querySelector(':scope .ep-detail-glyph');
	const hint = root.querySelector<HTMLElement>(':scope .ep-detail-hint');
	const name = root.querySelector(':scope .ep-detail-name');
	const note = root.querySelector<HTMLElement>(':scope .ep-detail-note');

	if (!glyph || !hint || !name || !note) return undefined;

	return { glyph, hint, name, note };
}

export function renderDetail(parts: DetailParts, cell: HTMLButtonElement) {
	const isUnsupported = cell.classList.contains('ep-unsupported');

	parts.glyph.textContent = cell.textContent;
	parts.glyph.classList.toggle('ep-unsupported', isUnsupported);
	parts.name.textContent = cell.getAttribute('aria-label') ?? '';
	parts.hint.hidden = isUnsupported || cell.dataset.skins === undefined;
	parts.note.hidden = !isUnsupported;
	parts.note.textContent = isUnsupported
		? `Emoji ${versionShown(cell) ?? ''}, too new for this device`
		: '';
}
