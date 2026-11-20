function sectionTop(scroller: Element, section: Element) {
	return (
		section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
	);
}

function sectionFor(root: Element, link: HTMLAnchorElement) {
	const id = link.hash.slice(1);

	return id === '' ? undefined : (root.querySelector(`[id="${CSS.escape(id)}"]`) ?? undefined);
}

function moveUnderline(links: Array<HTMLAnchorElement>, current: HTMLAnchorElement | undefined) {
	if (!current) return;

	current.parentElement?.style.setProperty('--ep-tab', String(links.indexOf(current)));
}

function markCurrent(root: Element, scroller: Element, links: Array<HTMLAnchorElement>) {
	const scrollerTop = scroller.getBoundingClientRect().top;
	let current: HTMLAnchorElement | undefined;

	for (const link of links) {
		const section = sectionFor(root, link);

		if (!(section instanceof HTMLElement) || section.hidden) continue;

		// Sections collapse to zero height while a query is present, so none reads as current
		const rect = section.getBoundingClientRect();

		if (rect.height > 0 && rect.top - scrollerTop <= 8) current = link;
	}

	for (const link of links) link.setAttribute('aria-current', String(link === current));

	moveUnderline(links, current);
}

// By the second frame `content-visibility: auto` sees them on screen
function holdRendered(section: Element) {
	const sections = [section, section.nextElementSibling].filter((element) => element !== null);

	for (const held of sections) held.classList.add('ep-jump-target');

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			for (const held of sections) held.classList.remove('ep-jump-target');
		});
	});
}

interface CategoryBarOptions {
	beforeJump: () => void;
	root: Element;
	scroller: Element;
}

// Anchor links work before the script lands; once it does, jumps stay inside the scroller
export function wireCategoryBar(
	{ beforeJump, root, scroller }: CategoryBarOptions,
	signal: AbortSignal,
) {
	const links = [...root.querySelectorAll<HTMLAnchorElement>(':scope .ep-categories a')];
	let frame = 0;

	for (const link of links) {
		link.addEventListener(
			'click',
			(event) => {
				const section = sectionFor(root, link);

				if (!section) return;

				event.preventDefault();
				beforeJump();
				holdRendered(section);
				scroller.scrollTo({ top: sectionTop(scroller, section) });
			},
			{ signal },
		);
	}

	scroller.addEventListener(
		'scroll',
		() => {
			if (frame !== 0) return;

			frame = requestAnimationFrame(() => {
				frame = 0;
				markCurrent(root, scroller, links);
			});
		},
		{ passive: true, signal },
	);

	signal.addEventListener('abort', () => {
		cancelAnimationFrame(frame);
	});

	markCurrent(root, scroller, links);

	return function refresh() {
		markCurrent(root, scroller, links);
	};
}
