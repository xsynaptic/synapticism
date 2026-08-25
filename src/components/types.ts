// A single previous/next target for content navigation
export interface ContentNavigationItem {
	title: string;
	url: string;
}

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
	image?: MetaImageProps | undefined;
	imageAlt?: string | undefined;
	noFollow?: boolean;
	noIndex?: boolean;
	ogType?: 'article' | 'website' | undefined;
	prefetchUrls?: Array<string> | undefined;
	title?: string | undefined;
}

interface MetaImageProps {
	alt?: string;
	height?: number;
	secureUrl?: string | URL;
	type?: string;
	url?: string | URL;
	width?: number;
}

export const DividerColorEnum = {
	Darker: 'darker',
	Default: 'default',
	Lighter: 'lighter',
} as const;

export type DividerColor = (typeof DividerColorEnum)[keyof typeof DividerColorEnum];

export const DividerContentEnum = {
	Bar: 'bar',
	Bullet: 'bullet',
	Chevron: 'chevron',
	Dot: 'dot',
	Slash: 'slash',
} as const;

export type DividerContent = (typeof DividerContentEnum)[keyof typeof DividerContentEnum];

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
