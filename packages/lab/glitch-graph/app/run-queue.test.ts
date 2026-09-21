import { describe, expect, it } from 'vitest';

import { createRunQueue } from '#glitch-graph/app/run-queue.ts';

function createRecorder() {
	const busy: Array<boolean> = [];
	const started: Array<string> = [];
	let release: ((value: number) => void) | undefined;

	const perform = async (request: string) => {
		const { promise, resolve } = Promise.withResolvers<number>();

		started.push(request);
		release = resolve;

		await promise;
	};

	return {
		busy,
		finish: async () => {
			const resolve = release;

			release = undefined;
			resolve?.(0);

			await flush();
		},
		request: createRunQueue(perform, (isBusy) => {
			busy.push(isBusy);
		}),
		started,
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

		recorder.request('first');

		expect(recorder.started).toEqual(['first']);
	});

	it('holds a request back while one is running', async () => {
		const recorder = createRecorder();

		recorder.request('first');
		recorder.request('second');

		expect(recorder.started).toEqual(['first']);

		await recorder.finish();

		expect(recorder.started).toEqual(['first', 'second']);
	});

	it('keeps only the last of several requests made during a run', async () => {
		const recorder = createRecorder();

		recorder.request('first');
		recorder.request('second');
		recorder.request('third');
		recorder.request('fourth');

		await recorder.finish();

		expect(recorder.started).toEqual(['first', 'fourth']);
	});

	it('stops once the queue drains, rather than repeating the last request', async () => {
		const recorder = createRecorder();

		recorder.request('first');
		recorder.request('second');

		await recorder.finish();
		await recorder.finish();

		expect(recorder.started).toEqual(['first', 'second']);
	});

	it('stays busy across queued runs, and reports idle only once drained', async () => {
		const recorder = createRecorder();

		recorder.request('first');
		recorder.request('second');

		await recorder.finish();

		expect(recorder.busy).toEqual([true]);

		await recorder.finish();

		expect(recorder.busy).toEqual([true, false]);
	});

	it('accepts a new request after a failed run', async () => {
		const attempted: Array<string> = [];
		const request = createRunQueue((name: string) => {
			attempted.push(name);

			return Promise.reject(new Error('the run failed'));
		}, noop);

		request('first');

		await flush();

		request('second');

		await flush();

		expect(attempted).toEqual(['first', 'second']);
	});
});

function noop() {
	return;
}
