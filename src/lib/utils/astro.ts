import type { AstroGlobal } from 'astro';
import type { CollectionEntry } from 'astro:content';

export function getHasContent(entry: CollectionEntry<'pages' | 'posts' | 'projects' | 'tags'>) {
	return 'body' in entry && typeof entry.body === 'string' && entry.body.trim().length > 0;
}

export async function renderSlot(slots: AstroGlobal['slots'], slotName = 'default') {
	const content = (await slots.render(slotName)) as string | undefined;
	const contentTrimmed = content ? content.trim() : undefined;

	return contentTrimmed ?? undefined;
}
