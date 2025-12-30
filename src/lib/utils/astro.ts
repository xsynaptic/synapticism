import type { AstroGlobal } from 'astro';

/**
 * Safely renders an Astro slot, returning undefined if the content is empty or whitespace-only
 */
export async function renderSlot(slots: AstroGlobal['slots'], slotName = 'default') {
	const content = (await slots.render(slotName)) as string | undefined;
	const contentTrimmed = content ? content.trim() : undefined;

	return contentTrimmed ?? undefined;
}
