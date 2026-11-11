import { gridMoves, moveInGrid } from '#emoji-picker/core/grid-navigation.ts';

export const cellSelector = '.ep-cells > button';

export type GridKey = keyof typeof gridMoves;

export function isCell(target: unknown): target is HTMLButtonElement {
	return target instanceof HTMLButtonElement && target.matches(cellSelector);
}

export function isGridKey(key: string): key is GridKey {
	return Object.hasOwn(gridMoves, key);
}

function navigableContainers(root: Element) {
	const results = root.querySelector<HTMLElement>(':scope .ep-results');
	const sections =
		results && !results.hidden
			? [results]
			: [...root.querySelectorAll<HTMLElement>(':scope .ep-recents, :scope .ep-group')];

	return sections
		.map((section) => section.querySelector<HTMLElement>(':scope > .ep-cells'))
		.filter(
			(container): container is HTMLElement => container !== null && container.children.length > 0,
		);
}

export function setActiveCell(root: Element, cell: HTMLButtonElement, shouldFocus: boolean) {
	for (const active of root.querySelectorAll<HTMLButtonElement>(
		`:scope ${cellSelector}[tabindex="0"]`,
	)) {
		if (active !== cell) active.tabIndex = -1;
	}

	cell.tabIndex = 0;

	if (shouldFocus) cell.focus();
}

export function focusFirstCell(root: Element, shouldFocus: boolean) {
	const first = navigableContainers(root)[0]?.children[0];

	if (first instanceof HTMLButtonElement) setActiveCell(root, first, shouldFocus);
}

export function moveFocus(root: Element, from: HTMLButtonElement, key: GridKey) {
	const containers = navigableContainers(root);
	const section = containers.findIndex((container) => container === from.parentElement);
	const cells = containers[section]?.children;

	if (!cells) return;

	// Every cell container inherits the column count the container query sets on the scroller
	const columns =
		Number(getComputedStyle(from.parentElement ?? from).getPropertyValue('--ep-columns')) || 1;
	const sizes = containers.map((container) => container.children.length);
	const target = moveInGrid(
		{ columns, sizes },
		{ index: [...cells].indexOf(from), section },
		gridMoves[key],
	);
	const next = containers[target.section]?.children[target.index];

	if (next instanceof HTMLButtonElement) setActiveCell(root, next, true);
}

export function cloneCells(
	hexcodes: Array<string>,
	cellFor: (hexcode: string) => HTMLButtonElement | undefined,
) {
	const clones = hexcodes
		.map((hexcode) => cellFor(hexcode)?.cloneNode(true))
		.filter((clone) => clone instanceof HTMLButtonElement);

	for (const clone of clones) {
		clone.tabIndex = -1;
		clone.style.removeProperty('anchor-name');
	}

	return clones;
}
