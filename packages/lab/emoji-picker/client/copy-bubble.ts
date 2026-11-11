import { anchorCell, hidePlaced, placeWithoutAnchor } from '#emoji-picker/client/cell-anchor.ts';

const bubbleDuration = 1600;

export class CopyBubble {
	#popover: HTMLElement;
	#scroller: HTMLElement;
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor(popover: HTMLElement, scroller: HTMLElement) {
		this.#popover = popover;
		this.#scroller = scroller;
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
		anchorCell(this.#scroller, cell);

		if (!popover.matches(':popover-open')) popover.showPopover();

		placeWithoutAnchor(popover, cell);
		this.#timer = setTimeout(() => {
			this.hide();
		}, bubbleDuration);
	}
}
