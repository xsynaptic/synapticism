import type { CollectionKey } from 'astro:content';

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
	linksCount: number | undefined;
	postCount: number | undefined;
	title: string;
	url: string;
	wordCount: number | undefined;
}
