import type { CollectionEntry, CollectionKey } from 'astro:content';

import type { getTagsCollection } from '#lib/collections/tags/tags-data.ts';

type CollectionDataEntry<F extends () => Promise<{ entries: Array<unknown> }>> = Awaited<
	ReturnType<F>
>['entries'][number];

interface ComputedEntryMap {
	tags: CollectionDataEntry<typeof getTagsCollection>;
}

export type ComputedEntry<K extends CollectionKey> = K extends keyof ComputedEntryMap
	? ComputedEntryMap[K]
	: CollectionEntry<K>;
