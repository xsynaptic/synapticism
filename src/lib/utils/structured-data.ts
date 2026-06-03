import { getSiteUrl } from '#lib/utils/routing.ts';
import { sanitizeDescription } from '#lib/utils/text.ts';

interface IdReference {
	'@id': string;
}

interface Article {
	'@type': 'Article';
	'@id'?: string;
	headline: string;
	description?: string;
	image?: string;
	datePublished: string;
	dateModified?: string;
	author: IdReference;
	mainEntityOfPage: IdReference;
}

interface BreadcrumbList {
	'@type': 'BreadcrumbList';
	'@id'?: string;
	itemListElement: Array<{
		'@type': 'ListItem';
		position: number;
		name: string;
		item?: string;
	}>;
}

interface Person {
	'@type': 'Person';
	'@id'?: string;
	name: string;
	url: string;
}

interface WebSite {
	'@type': 'WebSite';
	'@id'?: string;
	name: string;
	url: string;
	description: string;
}

export type Thing = Article | BreadcrumbList | Person | WebSite;

interface Graph {
	'@context': 'https://schema.org';
	'@graph': ReadonlyArray<Thing>;
}

const SchemaFragmentIds = {
	Website: '#website',
	Breadcrumb: '#breadcrumb',
	Article: '#article',
	Author: '#author',
} as const;

export function serializeGraph(entities: Array<Thing>): string {
	const graph: Graph = {
		'@context': 'https://schema.org',
		'@graph': entities,
	};

	return JSON.stringify(graph)
		.replaceAll('<', String.raw`\u003c`)
		.replaceAll('>', String.raw`\u003e`)
		.replaceAll('&', String.raw`\u0026`);
}

export function buildBreadcrumbSchema(
	items: Array<{ name: string; url?: string }>,
	pageUrl: string,
): BreadcrumbList {
	return {
		'@type': 'BreadcrumbList',
		'@id': `${pageUrl}${SchemaFragmentIds.Breadcrumb}`,
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem' as const,
			position: index + 1,
			name: item.name,
			...(item.url ? { item: item.url } : {}),
		})),
	};
}

export function buildArticleSchema(props: {
	title: string;
	description: string | undefined;
	dateCreated: Date;
	dateUpdated: Date | undefined;
	url: string;
	imageUrl: string | undefined;
}): Article {
	const aboutUrl = getSiteUrl('/about');
	const description = sanitizeDescription(props.description);

	return {
		'@type': 'Article',
		'@id': `${props.url}${SchemaFragmentIds.Article}`,
		headline: props.title,
		...(description ? { description } : {}),
		...(props.imageUrl ? { image: props.imageUrl } : {}),
		datePublished: props.dateCreated.toISOString(),
		...(props.dateUpdated ? { dateModified: props.dateUpdated.toISOString() } : {}),
		author: { '@id': `${aboutUrl}${SchemaFragmentIds.Author}` },
		mainEntityOfPage: { '@id': props.url },
	};
}

export function buildAuthorSchema(name: string): Person {
	const aboutUrl = getSiteUrl('/about');

	return {
		'@type': 'Person',
		'@id': `${aboutUrl}${SchemaFragmentIds.Author}`,
		name,
		url: aboutUrl,
	};
}

export function buildWebSiteSchema(props: { name: string; description: string }): WebSite {
	const siteUrl = getSiteUrl();

	return {
		'@type': 'WebSite',
		'@id': `${siteUrl}${SchemaFragmentIds.Website}`,
		name: props.name,
		url: siteUrl,
		description: props.description,
	};
}
