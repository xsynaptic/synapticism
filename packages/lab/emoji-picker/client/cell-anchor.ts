const anchorName = '--ep-cell-anchor';

export function anchorCell(scroller: Element, cell: HTMLElement) {
	for (const anchored of scroller.querySelectorAll<HTMLElement>('[style*="anchor-name"]')) {
		if (anchored !== cell) anchored.style.removeProperty('anchor-name');
	}

	cell.style.setProperty('anchor-name', anchorName);
}

// Firefox may lack anchor positioning; there the popover is placed from the cell's rect once
export function placeWithoutAnchor(popover: HTMLElement, cell: HTMLElement) {
	if (CSS.supports(`anchor-name: ${anchorName}`)) return;

	const rect = cell.getBoundingClientRect();

	popover.style.left = `${String(rect.left + rect.width / 2)}px`;
	popover.style.top = `${String(rect.top)}px`;
	popover.classList.add('ep-unanchored');
}

export function hidePlaced(popover: HTMLElement) {
	if (!popover.matches(':popover-open')) return;

	popover.hidePopover();
	popover.classList.remove('ep-unanchored');
}
