import { anchorCell, hidePlaced, placeWithoutAnchor } from '#emoji-picker/client/cell-anchor.ts';

const bubbleDuration = 1600;

export class CopyBubble {
	#popover: HTMLElement;
	#root: HTMLElement;
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor(popover: HTMLElement, root: HTMLElement) {
		this.#popover = popover;
		this.#root = root;
	}

	hide() {
		clearTimeout(this.#timer);
		hidePlaced(this.#popover);
	}

	show(cell: HTMLElement, message: string, isError: boolean) {
		const popover = this.#popover;

		clearTimeout(this.#timer);
		popover.textContent = message;
		popover.classList.toggle('ep-bubble-error', isError);
		anchorCell(this.#root, cell);

		if (!popover.matches(':popover-open')) popover.showPopover();

		placeWithoutAnchor(popover, cell);
		this.#timer = setTimeout(() => {
			this.hide();
		}, bubbleDuration);
	}
}
