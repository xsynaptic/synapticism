// Latest request wins: a drag asks far faster than the engine can answer
export function createRunQueue<Request>(
	perform: (request: Request) => Promise<void>,
	onBusyChange: (isBusy: boolean) => void,
) {
	let isRunning = false;
	let pending: Request | undefined;

	async function drain() {
		while (pending !== undefined) {
			const next = pending;

			pending = undefined;

			try {
				await perform(next);
			} catch {
				// A failed run must not wedge the queue
			}
		}

		isRunning = false;
		onBusyChange(false);
	}

	// Busy spans the whole drag rather than each run, so nothing reads as idle between two queued runs
	return function request(next: Request) {
		pending = next;

		if (isRunning) return;

		isRunning = true;
		onBusyChange(true);
		void drain();
	};
}
