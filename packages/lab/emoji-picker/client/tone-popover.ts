import { anchorCell, hidePlaced, placeWithoutAnchor } from '#emoji-picker/client/cell-anchor.ts';
import { isCell } from '#emoji-picker/client/grid-focus.ts';

const longPressDelay = 450;
const moveTolerance = 8;

interface TonePopoverOptions {
	onChoose: (anchor: HTMLButtonElement, tone: number) => void;
	onShow: () => void;
	popover: HTMLElement;
	root: HTMLElement;
	scroller: HTMLElement;
}

function toneCell(target: unknown) {
	return isCell(target) && target.dataset.skins !== undefined ? target : undefined;
}

function setExpanded(anchor: HTMLElement | undefined, isExpanded: boolean) {
	if (anchor?.hasAttribute('aria-expanded'))
		anchor.setAttribute('aria-expanded', String(isExpanded));
}

function toneButtons(popover: HTMLElement) {
	return [...popover.querySelectorAll<HTMLButtonElement>(':scope > button[data-tone]')];
}

function fillTones(popover: HTMLElement, anchor: HTMLButtonElement) {
	const glyphs = anchor.dataset.skins?.split(' ') ?? [];
	const buttons = toneButtons(popover);

	for (const [tone, button] of buttons.entries()) button.textContent = glyphs[tone] ?? '';

	return buttons;
}

function moveAcrossTones(popover: HTMLElement, event: KeyboardEvent) {
	const buttons = toneButtons(popover);
	const index = buttons.findIndex((button) => button === document.activeElement);
	const step = event.key === 'ArrowRight' ? 1 : -1;

	event.preventDefault();
	buttons[(index + step + buttons.length) % buttons.length]?.focus();
}

// The click that follows a long-press release must not also copy
function wireLongPress(
	scroller: HTMLElement,
	signal: AbortSignal,
	onLongPress: (cell: HTMLButtonElement) => void,
) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let origin = { x: 0, y: 0 };
	let shouldSwallowClick = false;

	function cancel() {
		clearTimeout(timer);
		timer = undefined;
	}

	scroller.addEventListener(
		'pointerdown',
		(event) => {
			const cell = toneCell(event.target);

			shouldSwallowClick = false;

			if (!cell || event.button !== 0) return;

			origin = { x: event.clientX, y: event.clientY };
			timer = setTimeout(() => {
				shouldSwallowClick = true;
				onLongPress(cell);
			}, longPressDelay);
		},
		{ signal },
	);

	scroller.addEventListener(
		'pointermove',
		(event) => {
			if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > moveTolerance) cancel();
		},
		{ passive: true, signal },
	);

	for (const type of ['pointerup', 'pointercancel', 'scroll'] as const) {
		scroller.addEventListener(type, cancel, { passive: true, signal });
	}

	scroller.addEventListener(
		'click',
		(event) => {
			if (!shouldSwallowClick) return;

			shouldSwallowClick = false;
			event.preventDefault();
			event.stopImmediatePropagation();
		},
		{ capture: true, signal },
	);

	signal.addEventListener('abort', cancel);
}

interface PopoverHandlers {
	close: () => void;
	isToggle: (target: Node) => boolean;
	onChoose: (tone: number) => void;
}

function wirePopoverEvents(
	popover: HTMLElement,
	{ close, isToggle, onChoose }: PopoverHandlers,
	signal: AbortSignal,
) {
	popover.addEventListener(
		'click',
		(event) => {
			const tone = event.target instanceof HTMLElement ? event.target.dataset.tone : undefined;

			if (tone !== undefined) onChoose(Number(tone));
		},
		{ signal },
	);

	popover.addEventListener(
		'keydown',
		(event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				close();
				return;
			}

			if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') moveAcrossTones(popover, event);
		},
		{ signal },
	);

	document.addEventListener(
		'pointerdown',
		(event) => {
			// Left to the toggle's click, which would otherwise reopen it
			if (
				event.target instanceof Node &&
				(popover.contains(event.target) || isToggle(event.target))
			)
				return;

			close();
		},
		{ capture: true, signal },
	);
}

// A manual popover, since auto light dismiss closes it on the very pointerup that ends a long press
export class TonePopover {
	#anchor: HTMLButtonElement | undefined;
	#options: TonePopoverOptions;

	constructor(options: TonePopoverOptions, signal: AbortSignal) {
		this.#options = options;

		wireLongPress(options.scroller, signal, (cell) => {
			this.#show(cell, false);
		});
		this.#wireContextMenu(signal);
		wirePopoverEvents(
			options.popover,
			{
				close: () => {
					this.close();
				},
				isToggle: (target) =>
					this.isOpen() && this.#anchor?.contains(target) === true && !isCell(this.#anchor),
				onChoose: (tone) => {
					this.#choose(tone);
				},
			},
			signal,
		);
	}

	close() {
		const { popover } = this.#options;

		if (!this.isOpen()) return;

		const hadFocus = popover.contains(document.activeElement);

		hidePlaced(popover);
		setExpanded(this.#anchor, false);

		if (hadFocus) this.#anchor?.focus();
	}

	isOpen() {
		return this.#options.popover.matches(':popover-open');
	}

	open(anchor: HTMLButtonElement) {
		if (anchor.dataset.skins !== undefined) this.#show(anchor, true);
	}

	toggle(anchor: HTMLButtonElement) {
		if (this.isOpen() && this.#anchor === anchor) {
			this.close();
			return;
		}

		this.open(anchor);
	}

	#choose(tone: number) {
		const anchor = this.#anchor;

		if (!anchor) return;

		this.close();
		this.#options.onChoose(anchor, tone);
	}

	#show(anchor: HTMLButtonElement, shouldFocus: boolean) {
		const { onShow, popover, root } = this.#options;
		const buttons = fillTones(popover, anchor);

		onShow();

		if (this.#anchor !== anchor) setExpanded(this.#anchor, false);

		this.#anchor = anchor;
		anchorCell(root, anchor);

		// Android fires contextmenu after the long-press timer has already opened it
		if (!this.isOpen()) popover.showPopover();

		setExpanded(anchor, true);
		placeWithoutAnchor(popover, anchor);

		if (!shouldFocus) return;

		const current = buttons.find((button) => button.textContent === anchor.textContent);

		(current ?? buttons[0])?.focus();
	}

	#wireContextMenu(signal: AbortSignal) {
		this.#options.scroller.addEventListener(
			'contextmenu',
			(event) => {
				if (!isCell(event.target)) return;

				event.preventDefault();

				const cell = toneCell(event.target);

				if (cell) this.#show(cell, event.button !== 2);
			},
			{ signal },
		);
	}
}
