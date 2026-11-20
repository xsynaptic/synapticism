import { pickerStore } from '#emoji-picker/client/emoji-picker-store.ts';
import {
	cellSelector,
	cloneCells,
	focusFirstCell,
	gridColumns,
	isCell,
	setActiveCell,
} from '#emoji-picker/client/grid-focus.ts';
import { recentsRows } from '#emoji-picker/emoji-picker-constants.ts';

interface RecentsViewOptions {
	announce: (message: string) => void;
	cellFor: (hexcode: string) => HTMLButtonElement | undefined;
	root: HTMLElement;
	section: HTMLElement;
}

interface RecentsParts extends RecentsViewOptions {
	container: HTMLElement;
}

export class RecentsView {
	#columns = 0;
	#options: RecentsParts;

	constructor(options: RecentsParts, signal: AbortSignal) {
		this.#options = options;
		options.section.hidden = false;
		this.render();
		this.#wireClear(signal);
		this.#observeColumns(signal);
	}

	contains(cell: Element) {
		return this.#options.section.contains(cell);
	}

	// A tone change re-renders recents, detaching the chosen clone
	liveCell(cell: HTMLButtonElement, hexcode: string) {
		if (cell.isConnected) return cell;

		return (
			this.#options.container.querySelector<HTMLButtonElement>(
				`[data-hexcode="${CSS.escape(hexcode)}"]`,
			) ?? cell
		);
	}

	render() {
		const { cellFor, container, root } = this.#options;
		const columns = gridColumns(container);
		const active = document.activeElement;
		const focused =
			isCell(active) && container.contains(active) ? active.dataset.hexcode : undefined;
		const clones = cloneCells(
			pickerStore.getState().recents.slice(0, columns * recentsRows),
			cellFor,
		);

		this.#columns = columns;
		container.replaceChildren(...clones);

		const refocus = clones.find((clone) => clone.dataset.hexcode === focused);

		if (refocus) {
			setActiveCell(root, refocus, true);
			return;
		}

		if (!root.querySelector(`:scope ${cellSelector}[tabindex="0"]`)) focusFirstCell(root, false);
	}

	#observeColumns(signal: AbortSignal) {
		const { container } = this.#options;
		const observer = new ResizeObserver(() => {
			if (gridColumns(container) !== this.#columns) this.render();
		});

		observer.observe(container);
		signal.addEventListener('abort', () => {
			observer.disconnect();
		});
	}

	#wireClear(signal: AbortSignal) {
		const { announce, root, section } = this.#options;

		section.querySelector(':scope .ep-recents-clear')?.addEventListener(
			'click',
			(event) => {
				const hadFocus = event.currentTarget === document.activeElement;

				pickerStore.getState().clearRecents();
				announce('Recents cleared');

				if (hadFocus) focusFirstCell(root, true);
			},
			{ signal },
		);
	}
}

export function createRecentsView(options: RecentsViewOptions, signal: AbortSignal) {
	const container = options.section.querySelector<HTMLElement>(':scope > .ep-cells');

	return container ? new RecentsView({ ...options, container }, signal) : undefined;
}
