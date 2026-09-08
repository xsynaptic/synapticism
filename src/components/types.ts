export interface MetaProps {
	article?: {
		authors?: Array<string>;
		expirationTime?: string;
		modifiedTime?: string;
		publishedTime?: string;
		section?: string;
		tags?: Array<string>;
	};
	description?: string | undefined;
	noFollow?: boolean;
	noIndex?: boolean;
	ogType?: 'article' | 'website' | undefined;
	openGraphId?: string | undefined;
	prefetchUrls?: Array<string> | undefined;
	title?: string | undefined;
}

// A single previous/next target for entry pagination
export interface PaginationEntry {
	title: string;
	url: string;
}

export const MicroformatClassNames = {
	Author: 'p-author',
	Card: 'h-card',
	Category: 'p-category',
	DatePublished: 'dt-published',
	DateUpdated: 'dt-updated',
	Entry: 'h-entry',
	Feed: 'h-feed',
	Name: 'p-name',
	Organization: 'p-org',
	Photo: 'u-photo',
	Role: 'p-role',
	Summary: 'p-summary',
	Url: 'u-url',
} as const;
