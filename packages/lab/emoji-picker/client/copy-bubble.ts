import { anchorCell, hidePlaced, placeWithoutAnchor } from '#emoji-picker/client/cell-anchor.ts';

const bubbleDuration = 1200;
const fadeDuration = 150;

export class CopyBubble {
	#popover: HTMLElement;
	#root: HTMLElement;
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor(popover: HTMLElement, root: HTMLElement, signal: AbortSignal) {
		this.#popover = popover;
		this.#root = root;

		// Not `scroll`: scroll anchoring fires it when a copy grows the recents row
		for (const type of ['wheel', 'touchmove'] as const) {
			document.addEventListener(
				type,
				() => {
					this.#fade();
				},
				{ passive: true, signal },
			);
		}

		popover.addEventListener(
			'click',
			() => {
				this.hide();
			},
			{ signal },
		);
	}

	hide() {
		const popover = this.#popover;

		clearTimeout(this.#timer);
		hidePlaced(popover);
		popover.classList.remove('ep-bubble-pinned', 'ep-bubble-fading');
		popover.style.removeProperty('left');
		popover.style.removeProperty('top');
	}

	// Pinned, so a scroll leaves it behind to fade rather than carrying it along
	show(cell: HTMLElement, message: string) {
		const popover = this.#popover;

		this.hide();
		popover.textContent = message;
		anchorCell(this.#root, cell);
		popover.showPopover();
		placeWithoutAnchor(popover, cell);

		const rect = popover.getBoundingClientRect();

		popover.style.left = `${String(rect.left)}px`;
		popover.style.top = `${String(rect.top)}px`;
		popover.classList.add('ep-bubble-pinned');
		this.#timer = setTimeout(() => {
			this.hide();
		}, bubbleDuration);
	}

	#fade() {
		const popover = this.#popover;

		if (!popover.matches(':popover-open') || popover.classList.contains('ep-bubble-fading')) return;

		clearTimeout(this.#timer);
		popover.classList.add('ep-bubble-fading');
		this.#timer = setTimeout(() => {
			this.hide();
		}, fadeDuration);
	}
}
