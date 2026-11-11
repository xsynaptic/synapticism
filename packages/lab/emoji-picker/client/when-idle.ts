export function whenIdle(callback: () => void) {
	if ('requestIdleCallback' in globalThis) {
		requestIdleCallback(callback, { timeout: 2000 });
		return;
	}

	setTimeout(callback, 200);
}
