// Requests coalesce into one further run: a drag asks far faster than the engine can answer
export function createRunQueue(
	perform: () => Promise<void>,
	onBusyChange: (isBusy: boolean) => void,
) {
	let isRunning = false;
	let isPending = false;

	async function drain() {
		while (isPending) {
			isPending = false;

			try {
				await perform();
			} catch {
				// A failed run must not wedge the queue
			}
		}

		isRunning = false;
		onBusyChange(false);
	}

	// Busy spans the whole drag rather than each run, so nothing reads as idle between two queued runs
	return function request() {
		isPending = true;

		if (isRunning) return;

		isRunning = true;
		onBusyChange(true);
		void drain();
	};
}
