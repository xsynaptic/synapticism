export const pressTimings = {
	moveTolerance: 8,
	scrubDelay: 250,
	toneDelay: 450,
} as const;

interface PressPoint {
	x: number;
	y: number;
}

export interface PressCell<T> {
	hasTones: boolean;
	id: T;
}

export type PressTarget<T> =
	{ cell: PressCell<T>; kind: 'cell' } | { id: T; kind: 'tone' } | { kind: 'none' };

export type PressState<T> =
	| { cell: PressCell<T>; isTouch: boolean; origin: PressPoint; phase: 'pending' }
	| { cell: PressCell<T> | undefined; phase: 'scrubbing' }
	| { phase: 'idle' }
	| { phase: 'toning'; tone: T | undefined };

export type PressEvent<T> =
	| { cell: PressCell<T>; isTouch: boolean; point: PressPoint; type: 'down' }
	| { point: PressPoint; target: PressTarget<T>; type: 'move' }
	| { type: 'cancel' }
	| { type: 'timer' }
	| { type: 'up' };

export type PressEffect<T> =
	| { cell: T; type: 'copy' }
	| { cell: T; type: 'openTones' }
	| { cell: T; type: 'preview' }
	| { delay: number; type: 'arm' }
	| { target: T | undefined; type: 'highlight' }
	| { tone: T; type: 'chooseTone' }
	| { type: 'disarm' }
	| { type: 'lock' }
	| { type: 'release' }
	| { type: 'restore' }
	| { type: 'swallowClick' };

interface PressStep<T> {
	effects: Array<PressEffect<T>>;
	state: PressState<T>;
}

type Pending<T> = Extract<PressState<T>, { phase: 'pending' }>;

type Scrubbing<T> = Extract<PressState<T>, { phase: 'scrubbing' }>;

type Toning<T> = Extract<PressState<T>, { phase: 'toning' }>;

const idle = { phase: 'idle' } as const;

function stay<T>(state: PressState<T>): PressStep<T> {
	return { effects: [], state };
}

function fromIdle<T>(event: PressEvent<T>): PressStep<T> {
	if (event.type !== 'down') return stay(idle);

	const { cell, isTouch, point } = event;
	const state = { cell, isTouch, origin: point, phase: 'pending' } as const;

	if (isTouch) {
		return {
			effects: [
				{ cell: cell.id, type: 'preview' },
				{ delay: pressTimings.scrubDelay, type: 'arm' },
			],
			state,
		};
	}

	return { effects: cell.hasTones ? [{ delay: pressTimings.toneDelay, type: 'arm' }] : [], state };
}

function hasDrifted(origin: PressPoint, point: PressPoint) {
	return Math.hypot(point.x - origin.x, point.y - origin.y) > pressTimings.moveTolerance;
}

// Counted from touchdown, so a still hold opens tones at the same moment as before
function startScrub<T>({ cell }: Pending<T>): PressStep<T> {
	return {
		effects: [
			{ type: 'lock' },
			{ target: cell.id, type: 'highlight' },
			...(cell.hasTones
				? [{ delay: pressTimings.toneDelay - pressTimings.scrubDelay, type: 'arm' } as const]
				: []),
		],
		state: { cell, phase: 'scrubbing' },
	};
}

// A drag is a scroll on touch, but nothing else for a mouse
function dragScrub<T>(target: PressTarget<T>): PressStep<T> {
	const step = scrubOnto<T>({ cell: undefined, phase: 'scrubbing' }, target);

	return { effects: [{ type: 'disarm' }, ...step.effects], state: step.state };
}

function fromPending<T>(state: Pending<T>, event: PressEvent<T>): PressStep<T> {
	if (event.type === 'move') {
		if (!hasDrifted(state.origin, event.point)) return stay(state);

		if (!state.isTouch) return dragScrub(event.target);

		return { effects: [{ type: 'disarm' }, { type: 'restore' }], state: idle };
	}

	if (event.type === 'timer') {
		if (state.isTouch) return startScrub(state);

		return {
			effects: [{ cell: state.cell.id, type: 'openTones' }],
			state: { phase: 'toning', tone: undefined },
		};
	}

	if (event.type === 'up') return { effects: [{ type: 'disarm' }], state: idle };

	return stay(state);
}

function scrubOnto<T>(state: Scrubbing<T>, target: PressTarget<T>): PressStep<T> {
	if (target.kind !== 'cell') {
		if (state.cell === undefined) return stay(state);

		return {
			effects: [{ target: undefined, type: 'highlight' }, { type: 'disarm' }],
			state: { cell: undefined, phase: 'scrubbing' },
		};
	}

	const { cell } = target;

	if (cell.id === state.cell?.id) return stay(state);

	return {
		effects: [
			{ cell: cell.id, type: 'preview' },
			{ target: cell.id, type: 'highlight' },
			cell.hasTones ? { delay: pressTimings.toneDelay, type: 'arm' } : { type: 'disarm' },
		],
		state: { cell, phase: 'scrubbing' },
	};
}

function fromScrubbing<T>(state: Scrubbing<T>, event: PressEvent<T>): PressStep<T> {
	if (event.type === 'move') return scrubOnto(state, event.target);

	if (event.type === 'timer') {
		if (!state.cell?.hasTones) return stay(state);

		return {
			effects: [{ cell: state.cell.id, type: 'openTones' }],
			state: { phase: 'toning', tone: undefined },
		};
	}

	if (event.type === 'up') {
		return {
			effects: [
				{ type: 'release' },
				{ type: 'swallowClick' },
				...(state.cell ? [{ cell: state.cell.id, type: 'copy' } as const] : []),
			],
			state: idle,
		};
	}

	return stay(state);
}

function fromToning<T>(state: Toning<T>, event: PressEvent<T>): PressStep<T> {
	if (event.type === 'move') {
		const tone = event.target.kind === 'tone' ? event.target.id : undefined;

		if (tone === state.tone) return stay(state);

		return { effects: [{ target: tone, type: 'highlight' }], state: { phase: 'toning', tone } };
	}

	if (event.type === 'up') {
		return {
			effects: [
				{ type: 'release' },
				{ type: 'swallowClick' },
				...(state.tone === undefined ? [] : [{ tone: state.tone, type: 'chooseTone' } as const]),
			],
			state: idle,
		};
	}

	return stay(state);
}

function cancel<T>(state: PressState<T>): PressStep<T> {
	if (state.phase === 'idle') return stay(state);

	if (state.phase === 'pending') {
		return {
			effects: [{ type: 'disarm' }, ...(state.isTouch ? [{ type: 'restore' } as const] : [])],
			state: idle,
		};
	}

	return { effects: [{ type: 'disarm' }, { type: 'release' }], state: idle };
}

export function reducePress<T>(state: PressState<T>, event: PressEvent<T>): PressStep<T> {
	if (event.type === 'cancel') return cancel(state);

	if (state.phase === 'pending') return fromPending(state, event);

	if (state.phase === 'scrubbing') return fromScrubbing(state, event);

	if (state.phase === 'toning') return fromToning(state, event);

	return fromIdle(event);
}
