import type { TonePopover } from '#emoji-picker/client/tone-popover.ts';
import type {
	PressCell,
	PressEffect,
	PressEvent,
	PressState,
	PressTarget,
} from '#emoji-picker/core/press-gesture.ts';

import { isCell } from '#emoji-picker/client/grid-focus.ts';
import { reducePress } from '#emoji-picker/core/press-gesture.ts';

type Effect = PressEffect<HTMLButtonElement>;

type EffectHandlers = {
	[Type in Effect['type']]: (effect: Extract<Effect, { type: Type }>) => void;
};

interface PressGestureOptions {
	onCopy: (cell: HTMLButtonElement) => void;
	preview: {
		read: () => string | undefined;
		show: (hexcode: string | undefined) => void;
	};
	scroller: HTMLElement;
	tones: TonePopover;
}

function pressCell(cell: HTMLButtonElement): PressCell<HTMLButtonElement> {
	return { hasTones: cell.dataset.skins !== undefined, id: cell };
}

function isToneKey(element: Element | null): element is HTMLButtonElement {
	return (
		element instanceof HTMLButtonElement &&
		element.dataset.tone !== undefined &&
		element.closest('.ep-tones') !== null
	);
}

class PressGesture {
	get isActive() {
		return this.#state.phase !== 'idle';
	}

	get isLocked() {
		return this.#isLocked;
	}

	#handlers: EffectHandlers;
	#highlighted: HTMLElement | undefined;
	#isLocked = false;
	#options: PressGestureOptions;
	#pointerId: number | undefined;
	#previous: string | undefined;
	#shouldSwallowClick = false;
	#state: PressState<HTMLButtonElement> = { phase: 'idle' };
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor(options: PressGestureOptions) {
		this.#options = options;
		this.#handlers = this.#createHandlers();
	}

	dispatch(event: PressEvent<HTMLButtonElement>) {
		const step = reducePress(this.#state, event);

		this.#state = step.state;

		for (const effect of step.effects) this.#apply(effect);

		if (step.state.phase === 'idle') this.#pointerId = undefined;
	}

	down(event: PointerEvent, cell: HTMLButtonElement) {
		this.#shouldSwallowClick = false;
		this.#pointerId = event.pointerId;
		this.#previous = this.#options.preview.read();
		this.dispatch({
			cell: pressCell(cell),
			isTouch: event.pointerType !== 'mouse',
			point: { x: event.clientX, y: event.clientY },
			type: 'down',
		});
	}

	isPointer(event: PointerEvent) {
		return this.#pointerId === event.pointerId;
	}

	move(event: PointerEvent) {
		this.dispatch({
			point: { x: event.clientX, y: event.clientY },
			target: this.#targetAt(event.clientX, event.clientY),
			type: 'move',
		});
	}

	resetSwallow() {
		this.#shouldSwallowClick = false;
	}

	stop() {
		clearTimeout(this.#timer);
	}

	takeSwallow() {
		const shouldSwallow = this.#shouldSwallowClick;

		this.#shouldSwallowClick = false;

		return shouldSwallow;
	}

	#apply(effect: Effect) {
		// TypeScript cannot correlate a handler with its effect through the key
		(this.#handlers[effect.type] as (effect: Effect) => void)(effect);
	}

	#createHandlers(): EffectHandlers {
		const { onCopy, preview, tones } = this.#options;

		return {
			arm: ({ delay }) => {
				clearTimeout(this.#timer);
				this.#timer = setTimeout(() => {
					this.dispatch({ type: 'timer' });
				}, delay);
			},
			chooseTone: ({ tone }) => {
				tone.click();
			},
			copy: ({ cell }) => {
				onCopy(cell);
			},
			disarm: () => {
				clearTimeout(this.#timer);
			},
			highlight: ({ target }) => {
				this.#highlight(target);
			},
			lock: () => {
				this.#isLocked = true;
			},
			openTones: ({ cell }) => {
				tones.open(cell, false);
			},
			preview: ({ cell }) => {
				preview.show(cell.dataset.hexcode);
			},
			release: () => {
				this.#isLocked = false;
				this.#highlight(undefined);
			},
			restore: () => {
				preview.show(this.#previous);
			},
			swallowClick: () => {
				this.#shouldSwallowClick = true;
			},
		};
	}

	#highlight(target: HTMLElement | undefined) {
		this.#highlighted?.classList.remove('ep-pressed');
		this.#highlighted = target;
		target?.classList.add('ep-pressed');
	}

	// Touch pointers stay captured by the first cell
	#targetAt(x: number, y: number): PressTarget<HTMLButtonElement> {
		const element = document.elementFromPoint(x, y);

		if (isToneKey(element)) return { id: element, kind: 'tone' };

		if (isCell(element) && this.#options.scroller.contains(element))
			return { cell: pressCell(element), kind: 'cell' };

		return { kind: 'none' };
	}
}

function wirePointer(gesture: PressGesture, scroller: HTMLElement, signal: AbortSignal) {
	scroller.addEventListener(
		'pointerdown',
		(event) => {
			gesture.resetSwallow();

			if (!event.isPrimary || event.button !== 0 || !isCell(event.target)) return;

			gesture.down(event, event.target);
		},
		{ signal },
	);

	// The tone popover sits outside the scroller
	document.addEventListener(
		'pointermove',
		(event) => {
			if (gesture.isPointer(event)) gesture.move(event);
		},
		{ passive: true, signal },
	);

	for (const [type, pressType] of [
		['pointerup', 'up'],
		['pointercancel', 'cancel'],
	] as const) {
		document.addEventListener(
			type,
			(event) => {
				if (gesture.isPointer(event)) gesture.dispatch({ type: pressType });
			},
			{ passive: true, signal },
		);
	}

	scroller.addEventListener(
		'scroll',
		() => {
			if (gesture.isActive && !gesture.isLocked) gesture.dispatch({ type: 'cancel' });
		},
		{ passive: true, signal },
	);
}

// iOS only honours `preventDefault` from a listener present at touchstart
function wireScrollLock(gesture: PressGesture, scroller: HTMLElement, signal: AbortSignal) {
	scroller.addEventListener(
		'touchmove',
		(event) => {
			if (gesture.isLocked && event.cancelable) event.preventDefault();
		},
		{ passive: false, signal },
	);
}

function wireClickSwallow(gesture: PressGesture, scroller: HTMLElement, signal: AbortSignal) {
	scroller.addEventListener(
		'click',
		(event) => {
			if (!gesture.takeSwallow()) return;

			event.preventDefault();
			event.stopImmediatePropagation();
		},
		{ capture: true, signal },
	);

	// A held press may end without a click, which would swallow Enter's
	scroller.addEventListener(
		'keydown',
		() => {
			gesture.resetSwallow();
		},
		{ capture: true, signal },
	);
}

// Android fires `contextmenu` mid-press
function wireContextMenu(
	gesture: PressGesture,
	{ scroller, tones }: PressGestureOptions,
	signal: AbortSignal,
) {
	scroller.addEventListener(
		'contextmenu',
		(event) => {
			if (!isCell(event.target)) return;

			event.preventDefault();

			if (gesture.isActive) return;

			tones.open(event.target, event.button !== 2);
		},
		{ signal },
	);
}

export function wirePressGesture(options: PressGestureOptions, signal: AbortSignal) {
	const gesture = new PressGesture(options);
	const { scroller } = options;

	wirePointer(gesture, scroller, signal);
	wireScrollLock(gesture, scroller, signal);
	wireClickSwallow(gesture, scroller, signal);
	wireContextMenu(gesture, options, signal);

	signal.addEventListener('abort', () => {
		gesture.dispatch({ type: 'cancel' });
		gesture.stop();
	});
}
