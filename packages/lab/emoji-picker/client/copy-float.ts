const floatDuration = 750;

const floats = new WeakMap<HTMLElement, Animation>();

export function floatGlyph(cell: HTMLElement) {
	const rise = matchMedia('(prefers-reduced-motion: reduce)').matches ? '0' : '-28px';

	floats.get(cell)?.cancel();
	cell.dataset.float = cell.classList.contains('ep-unsupported') ? '?' : cell.textContent;

	const animation = cell.animate(
		[
			{ opacity: 0.9, scale: 1, translate: '0 0' },
			{ opacity: 0, scale: 0.9, translate: `0 ${rise}` },
		],
		{ duration: floatDuration, easing: 'ease-out', pseudoElement: '::before' },
	);

	animation.addEventListener('finish', () => {
		delete cell.dataset.float;
	});
	floats.set(cell, animation);
}
