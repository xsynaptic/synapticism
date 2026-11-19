const preloadTimeout = 3000;

// A hung stylesheet falls back to an unstyled flash rather than stalling navigation
function preloadStylesheet(href: string) {
	return new Promise<void>((resolve) => {
		const link = document.createElement('link');

		link.rel = 'preload';
		link.as = 'style';
		link.href = href;

		for (const type of ['load', 'error']) {
			link.addEventListener(type, () => {
				resolve();
			});
		}

		setTimeout(resolve, preloadTimeout);
		document.head.append(link);
	});
}

// ClientRouter awaits only head stylesheets, and Labs link theirs from the body
document.addEventListener('astro:before-preparation', (event) => {
	const loadNext = event.loader;

	event.loader = async () => {
		await loadNext();

		if (event.defaultPrevented || event.signal.aborted) return;

		const pending = [
			...event.newDocument.body.querySelectorAll<HTMLLinkElement>(':scope link[rel="stylesheet"]'),
		]
			.map((link) => link.getAttribute('href'))
			.filter((href) => href !== null)
			// Only head links survive the swap; a matching body link is replaced and refetched
			.filter(
				(href) =>
					!document.head.querySelector(`:scope link[rel="stylesheet"][href="${CSS.escape(href)}"]`),
			);

		await Promise.all(pending.map((href) => preloadStylesheet(href)));
	};
});
