import { describe, expect, it } from 'vitest';

import { createRunQueue } from '#glitch-graph/app/run-queue.ts';

function createRecorder() {
	const busy: Array<boolean> = [];
	const counts = { started: 0 };
	let release: ((value: number) => void) | undefined;

	const perform = async () => {
		const { promise, resolve } = Promise.withResolvers<number>();

		counts.started += 1;
		release = resolve;

		await promise;
	};

	return {
		busy,
		counts,
		finish: async () => {
			const resolve = release;

			release = undefined;
			resolve?.(0);

			await flush();
		},
		request: createRunQueue(perform, (isBusy) => {
			busy.push(isBusy);
		}),
	};
}

function flush() {
	return new Promise((resolve) => {
		setTimeout(resolve, 0);
	});
}

describe('createRunQueue', () => {
	it('runs an idle request at once', () => {
		const recorder = createRecorder();

		recorder.request();

		expect(recorder.counts.started).toBe(1);
	});

	it('holds a request back while one is running', async () => {
		const recorder = createRecorder();

		recorder.request();
		recorder.request();

		expect(recorder.counts.started).toBe(1);

		await recorder.finish();

		expect(recorder.counts.started).toBe(2);
	});

	it('coalesces several requests made during a run into one further run', async () => {
		const recorder = createRecorder();

		recorder.request();
		recorder.request();
		recorder.request();
		recorder.request();

		await recorder.finish();
		await recorder.finish();

		expect(recorder.counts.started).toBe(2);
	});

	it('stays busy across queued runs, and reports idle only once drained', async () => {
		const recorder = createRecorder();

		recorder.request();
		recorder.request();

		await recorder.finish();

		expect(recorder.busy).toEqual([true]);

		await recorder.finish();

		expect(recorder.busy).toEqual([true, false]);
	});

	it('accepts a new request after a failed run', async () => {
		let attempts = 0;
		const request = createRunQueue(() => {
			attempts += 1;

			return Promise.reject(new Error('the run failed'));
		}, noop);

		request();

		await flush();

		request();

		await flush();

		expect(attempts).toBe(2);
	});
});

function noop() {
	return;
}
