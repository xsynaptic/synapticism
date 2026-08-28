import { getSiteUrl } from '#lib/utils/routing.ts';

export type Thing = Article | BreadcrumbList | Person | WebSite;

interface Article {
	'@id'?: string;
	'@type': 'Article';
	author: IdReference;
	dateModified?: string;
	datePublished: string;
	description?: string;
	headline: string;
	image?: string;
	mainEntityOfPage: IdReference;
}

interface BreadcrumbList {
	'@id'?: string;
	'@type': 'BreadcrumbList';
	itemListElement: Array<{
		'@type': 'ListItem';
		item?: string;
		name: string;
		position: number;
	}>;
}

interface Graph {
	'@context': 'https://schema.org';
	'@graph': ReadonlyArray<Thing>;
}

interface IdReference {
	'@id': string;
}

interface Person {
	'@id'?: string;
	'@type': 'Person';
	name: string;
	url: string;
}

interface WebSite {
	'@id'?: string;
	'@type': 'WebSite';
	description: string;
	name: string;
	url: string;
}

const SchemaFragmentIds = {
	Article: '#article',
	Author: '#author',
	Breadcrumb: '#breadcrumb',
	Website: '#website',
} as const;

export function buildArticleSchema(props: {
	dateCreated: Date;
	dateUpdated: Date | undefined;
	description: string | undefined;
	imageUrl: string | undefined;
	title: string;
	url: string;
}): Article {
	const aboutUrl = getSiteUrl('/about');

	return {
		'@id': `${props.url}${SchemaFragmentIds.Article}`,
		'@type': 'Article',
		headline: props.title,
		...(props.description ? { description: props.description } : {}),
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
		'@id': `${aboutUrl}${SchemaFragmentIds.Author}`,
		'@type': 'Person',
		name,
		url: aboutUrl,
	};
}

/** @knipignore staged for the launch design; the schema graph has no breadcrumb consumer yet */
export function buildBreadcrumbSchema(
	items: Array<{ name: string; url?: string }>,
	pageUrl: string,
): BreadcrumbList {
	return {
		'@id': `${pageUrl}${SchemaFragmentIds.Breadcrumb}`,
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem' as const,
			name: item.name,
			position: index + 1,
			...(item.url ? { item: item.url } : {}),
		})),
	};
}

export function buildWebSiteSchema(props: { description: string; name: string }): WebSite {
	const siteUrl = getSiteUrl();

	return {
		'@id': `${siteUrl}${SchemaFragmentIds.Website}`,
		'@type': 'WebSite',
		description: props.description,
		name: props.name,
		url: siteUrl,
	};
}

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
