import type { CollectionKey } from 'astro:content';
import type { z } from 'zod';

import type { LinkItemSchema } from '#lib/schemas/content.ts';

export type CatalogCaption = Pick<CatalogItem, 'id' | 'title' | 'url'>;

export type CatalogCollectionKey = Extract<
	CollectionKey,
	'notes' | 'pages' | 'posts' | 'projects' | 'tags'
>;

export interface CatalogItem<T extends CatalogCollectionKey = CatalogCollectionKey> {
	backlinks: Set<string>;
	collection: T;
	dateCreated: Date;
	dateUpdated: Date | undefined;
	description: string | undefined;
	entryQuality: number | undefined;
	id: string;
	imageId: string | undefined;
	links: Array<z.infer<typeof LinkItemSchema>> | undefined;
	linksCount: number | undefined;
	postCount: number | undefined;
	title: string;
	url: string;
	wordCount: number | undefined;
}
