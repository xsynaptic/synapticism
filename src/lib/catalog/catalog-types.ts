import type { CollectionKey } from 'astro:content';

export type CatalogCollectionKey = Extract<
	CollectionKey,
	'notes' | 'pages' | 'posts' | 'projects' | 'tags'
>;

export interface CatalogItem<T extends CatalogCollectionKey = CatalogCollectionKey> {
	collection: T;
	id: string;
	title: string;
	description: string | undefined;
	url: string;
	imageId: string | undefined;
	postCount: number | undefined;
	wordCount: number | undefined;
	linksCount: number | undefined;
	backlinks: Set<string>;
	dateCreated: Date;
	dateUpdated: Date | undefined;
	entryQuality: number | undefined;
}

export type CatalogCaption = Pick<CatalogItem, 'title' | 'id' | 'url'>;
