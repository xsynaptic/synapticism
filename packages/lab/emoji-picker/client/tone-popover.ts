import { isCell } from '#emoji-picker/client/grid-focus.ts';

const longPressDelay = 450;
const moveTolerance = 8;
const anchorName = '--ep-tone-anchor';

interface TonePopoverOptions {
	baseGlyph: (hexcode: string) => string | undefined;
	onChoose: (cell: HTMLButtonElement, tone: number) => void;
	popover: HTMLElement;
	scroller: HTMLElement;
}

function toneCell(target: unknown) {
	return isCell(target) && target.dataset.skins !== undefined ? target : undefined;
}

function toneButtons(popover: HTMLElement) {
	return [...popover.querySelectorAll<HTMLButtonElement>(':scope > button[data-tone]')];
}

// Firefox may lack anchor positioning; there the popover is placed from the cell's rect once
function placeWithoutAnchor(popover: HTMLElement, cell: HTMLButtonElement) {
	if (CSS.supports(`anchor-name: ${anchorName}`)) return;

	const rect = cell.getBoundingClientRect();

	popover.style.left = `${String(rect.left + rect.width / 2)}px`;
	popover.style.top = `${String(rect.top)}px`;
	popover.classList.add('ep-tones-unanchored');
}

function fillTones(popover: HTMLElement, cell: HTMLButtonElement, baseGlyph: string | undefined) {
	const glyphs = [baseGlyph, ...(cell.dataset.skins?.split(' ') ?? [])];
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
	onChoose: (tone: number) => void;
}

function wirePopoverEvents(
	popover: HTMLElement,
	{ close, onChoose }: PopoverHandlers,
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
			if (event.target instanceof Node && popover.contains(event.target)) return;

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

		popover.hidePopover();
		popover.classList.remove('ep-tones-unanchored');

		if (hadFocus) this.#anchor?.focus();
	}

	isOpen() {
		return this.#options.popover.matches(':popover-open');
	}

	open(cell: HTMLButtonElement) {
		if (toneCell(cell)) this.#show(cell, true);
	}

	#choose(tone: number) {
		const cell = this.#anchor;

		if (!cell) return;

		this.close();
		this.#options.onChoose(cell, tone);
	}

	#show(cell: HTMLButtonElement, shouldFocus: boolean) {
		const { baseGlyph, popover } = this.#options;
		const buttons = fillTones(popover, cell, baseGlyph(cell.dataset.hexcode ?? ''));

		this.#anchor?.style.removeProperty('anchor-name');
		this.#anchor = cell;
		cell.style.setProperty('anchor-name', anchorName);

		// Android fires contextmenu after the long-press timer has already opened it
		if (!this.isOpen()) popover.showPopover();

		placeWithoutAnchor(popover, cell);

		if (!shouldFocus) return;

		const current = buttons.find((button) => button.textContent === cell.textContent);

		(current ?? buttons[0])?.focus();
	}

	#wireContextMenu(signal: AbortSignal) {
		this.#options.scroller.addEventListener(
			'contextmenu',
			(event) => {
				const cell = toneCell(event.target);

				if (!cell) return;

				event.preventDefault();
				this.#show(cell, event.button !== 2);
			},
			{ signal },
		);
	}
}
