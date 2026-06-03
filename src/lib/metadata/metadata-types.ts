import type { CollectionKey } from 'astro:content';

export type ContentMetadataCollectionKey = Extract<
	CollectionKey,
	'notes' | 'pages' | 'posts' | 'projects' | 'tags'
>;

export interface ContentMetadataItem<
	T extends ContentMetadataCollectionKey = ContentMetadataCollectionKey,
> {
	collection: T;
	id: string;
	title: string;
	description: string | undefined;
	url: string;
	dateCreated: Date;
	dateUpdated: Date | undefined;
}
