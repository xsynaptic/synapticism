import type { PageOpenGraphCard } from '@synapticism/shared/open-graph';

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
	openGraphCard?: PageOpenGraphCard | undefined;
	title?: string | undefined;
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
