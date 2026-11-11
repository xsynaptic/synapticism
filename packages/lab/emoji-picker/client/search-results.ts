import { cloneCells } from '#emoji-picker/client/grid-focus.ts';

interface ResultsView {
	cells: Element;
	empty: HTMLElement;
	failed: HTMLElement;
	section: HTMLElement;
}

export type ResultsState =
	{ hexcodes: Array<string>; kind: 'ready' } | { kind: 'failed' } | { kind: 'pending' };

export function queryResultsView(root: Element): ResultsView | undefined {
	const section = root.querySelector<HTMLElement>(':scope .ep-results');
	const cells = section?.querySelector(':scope > .ep-cells');
	const empty = section?.querySelector<HTMLElement>(':scope .ep-results-empty');
	const failed = section?.querySelector<HTMLElement>(':scope .ep-results-failed');

	if (!section || !cells || !empty || !failed) return undefined;

	return { cells, empty, failed, section };
}

// A one-letter query matches over 1,100 emoji; the first chunk fills the view, the rest follow a frame at a time
const firstChunk = 98;
const laterChunk = 56;

const generations = new WeakMap<Element, number>();

export function renderResults(
	view: ResultsView,
	state: ResultsState,
	cellFor: (hexcode: string) => HTMLButtonElement | undefined,
) {
	const current = (generations.get(view.cells) ?? 0) + 1;
	const all = state.kind === 'ready' ? state.hexcodes : [];
	let offset = firstChunk;

	generations.set(view.cells, current);
	view.cells.replaceChildren(...cloneCells(all.slice(0, offset), cellFor));
	view.empty.hidden = state.kind !== 'ready' || all.length > 0;
	view.failed.hidden = state.kind !== 'failed';

	function appendNext() {
		if (generations.get(view.cells) !== current || offset >= all.length) return;

		view.cells.append(...cloneCells(all.slice(offset, offset + laterChunk), cellFor));
		offset += laterChunk;
		requestAnimationFrame(appendNext);
	}

	requestAnimationFrame(appendNext);
}
