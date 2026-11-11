interface ResultsView {
	cells: Element;
	empty: HTMLElement;
	section: HTMLElement;
}

export function queryResultsView(root: Element): ResultsView | undefined {
	const section = root.querySelector<HTMLElement>(':scope .ep-results');
	const cells = section?.querySelector(':scope > .ep-cells');
	const empty = section?.querySelector<HTMLElement>(':scope .ep-results-empty');

	if (!section || !cells || !empty) return undefined;

	return { cells, empty, section };
}

// A one-letter query matches over 1,100 emoji; the first chunk fills the view, the rest follow a frame at a time
const firstChunk = 98;
const laterChunk = 56;

let generation = 0;

function cloneCells(
	hexcodes: Array<string>,
	cellFor: (hexcode: string) => HTMLButtonElement | undefined,
) {
	const clones = hexcodes
		.map((hexcode) => cellFor(hexcode)?.cloneNode(true))
		.filter((clone) => clone instanceof HTMLButtonElement);

	for (const clone of clones) clone.tabIndex = -1;

	return clones;
}

// `undefined` means a query is waiting on the index; it renders once the index lands
export function renderResults(
	view: ResultsView,
	hexcodes: Array<string> | undefined,
	cellFor: (hexcode: string) => HTMLButtonElement | undefined,
) {
	generation += 1;

	const current = generation;
	const all = hexcodes ?? [];
	let offset = firstChunk;

	view.cells.replaceChildren(...cloneCells(all.slice(0, offset), cellFor));
	view.empty.hidden = hexcodes === undefined || all.length > 0;

	function appendNext() {
		if (current !== generation || offset >= all.length) return;

		view.cells.append(...cloneCells(all.slice(offset, offset + laterChunk), cellFor));
		offset += laterChunk;
		requestAnimationFrame(appendNext);
	}

	requestAnimationFrame(appendNext);
}
