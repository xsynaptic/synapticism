import type { AstroGlobal } from 'astro';
import type { CollectionEntry } from 'astro:content';

import { render } from 'astro:content';

import Link from '#components/mdx/link.astro';
import More from '#components/mdx/more.astro';

type RenderableEntry = CollectionEntry<'notes' | 'pages' | 'posts' | 'projects' | 'tags'>;

// Provided to <Content> at render time, replacing the former remark-auto-import plugin
export const mdxComponents = { Link, More };

export function getHasContent(entry: CollectionEntry<'pages' | 'posts' | 'projects' | 'tags'>) {
	return 'body' in entry && typeof entry.body === 'string' && entry.body.trim().length > 0;
}

export async function renderContent(entry: RenderableEntry) {
	const rendered = await render(entry);

	return { ...rendered, components: mdxComponents };
}

/**
 * Safely renders an Astro slot, returning undefined if the content is empty or whitespace-only
 */
export async function renderSlot(slots: AstroGlobal['slots'], slotName = 'default') {
	const content = (await slots.render(slotName)) as string | undefined;
	const contentTrimmed = content ? content.trim() : undefined;

	return contentTrimmed ?? undefined;
}
