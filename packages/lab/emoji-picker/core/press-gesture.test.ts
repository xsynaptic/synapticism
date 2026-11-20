import { describe, expect, it } from 'vitest';

import type { PressEffect, PressEvent, PressState } from '#emoji-picker/core/press-gesture.ts';

import { pressTimings, reducePress } from '#emoji-picker/core/press-gesture.ts';

const hand = { hasTones: true, id: 'hand' };
const fire = { hasTones: false, id: 'fire' };
const origin = { x: 100, y: 100 };

interface Step {
	effects: Array<PressEffect<string>>;
	state: PressState<string>;
}

function run(events: Array<PressEvent<string>>) {
	let step: Step = { effects: [], state: { phase: 'idle' } };

	for (const event of events) step = reducePress(step.state, event);

	return step;
}

function touchDown(cell: typeof hand): PressEvent<string> {
	return { cell, isTouch: true, point: origin, type: 'down' };
}

function moveOnto(cell: typeof hand): PressEvent<string> {
	return { point: origin, target: { cell, kind: 'cell' }, type: 'move' };
}

const timer = { type: 'timer' } as const;
const up = { type: 'up' } as const;

describe('reducePress on touch', () => {
	it('previews on contact and waits to scrub', () => {
		expect(run([touchDown(fire)]).effects).toEqual([
			{ cell: 'fire', type: 'preview' },
			{ delay: pressTimings.scrubDelay, type: 'arm' },
		]);
	});

	it('treats a drift past the tolerance as a scroll and puts the detail back', () => {
		const drift = { point: { x: 100, y: 120 }, target: { kind: 'none' }, type: 'move' } as const;

		expect(run([touchDown(fire), drift])).toEqual({
			effects: [{ type: 'disarm' }, { type: 'restore' }],
			state: { phase: 'idle' },
		});
	});

	it('ignores jitter inside the tolerance', () => {
		const jitter = { point: { x: 104, y: 103 }, target: { kind: 'none' }, type: 'move' } as const;

		expect(run([touchDown(fire), jitter]).state.phase).toBe('pending');
	});

	it('keeps the tone timer counting from touchdown when the scrub starts', () => {
		expect(run([touchDown(hand), timer]).effects).toContainEqual({
			delay: pressTimings.toneDelay - pressTimings.scrubDelay,
			type: 'arm',
		});
	});

	it('restarts the tone timer on each tone-capable cell and drops it on others', () => {
		expect(run([touchDown(fire), timer, moveOnto(hand)]).effects).toContainEqual({
			delay: pressTimings.toneDelay,
			type: 'arm',
		});
		expect(run([touchDown(hand), timer, moveOnto(fire)]).effects).toContainEqual({
			type: 'disarm',
		});
	});

	it('copies the cell under the finger on lift, not the one first touched', () => {
		expect(run([touchDown(hand), timer, moveOnto(fire), up]).effects).toEqual([
			{ type: 'release' },
			{ type: 'swallowClick' },
			{ cell: 'fire', type: 'copy' },
		]);
	});

	it('copies nothing when the finger lifts off the grid', () => {
		const offGrid = { point: origin, target: { kind: 'none' }, type: 'move' } as const;

		expect(run([touchDown(hand), timer, offGrid, up]).effects).not.toContainEqual(
			expect.objectContaining({ type: 'copy' }),
		);
	});

	it('opens tones after a still hold and picks the tone the finger lifts on', () => {
		const ontoTone = {
			point: origin,
			target: { id: 'tone-3', kind: 'tone' },
			type: 'move',
		} as const;

		expect(run([touchDown(hand), timer, timer]).effects).toEqual([
			{ cell: 'hand', type: 'openTones' },
		]);
		expect(run([touchDown(hand), timer, timer, ontoTone, up]).effects).toContainEqual({
			tone: 'tone-3',
			type: 'chooseTone',
		});
	});

	it('leaves the popover open when the finger lifts off the tone keys', () => {
		const result = run([touchDown(hand), timer, timer, up]);

		expect(result.effects).toEqual([{ type: 'release' }, { type: 'swallowClick' }]);
	});

	it('unlocks when the browser cancels mid-scrub', () => {
		expect(run([touchDown(hand), timer, { type: 'cancel' }]).effects).toContainEqual({
			type: 'release',
		});
	});
});

describe('reducePress on a mouse', () => {
	it('skips the preview and holds straight for tones', () => {
		const down = { cell: hand, isTouch: false, point: origin, type: 'down' } as const;

		expect(run([down]).effects).toEqual([{ delay: pressTimings.toneDelay, type: 'arm' }]);
		expect(run([down, timer]).effects).toEqual([{ cell: 'hand', type: 'openTones' }]);
	});

	it('scrubs as soon as a press drags, since a mouse never scrolls by dragging', () => {
		const down = { cell: hand, isTouch: false, point: origin, type: 'down' } as const;
		const drag = {
			point: { x: 140, y: 100 },
			target: { cell: fire, kind: 'cell' },
			type: 'move',
		} as const;

		expect(run([down, drag])).toEqual({
			effects: [
				{ type: 'disarm' },
				{ cell: 'fire', type: 'preview' },
				{ target: 'fire', type: 'highlight' },
				{ type: 'disarm' },
			],
			state: { cell: fire, phase: 'scrubbing' },
		});
		expect(run([down, drag, up]).effects).toContainEqual({ cell: 'fire', type: 'copy' });
	});

	it('arms nothing on an emoji without tones', () => {
		const down = { cell: fire, isTouch: false, point: origin, type: 'down' } as const;

		expect(run([down]).effects).toEqual([]);
	});
});
