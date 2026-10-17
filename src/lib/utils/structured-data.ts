import type { CollectionEntry } from 'astro:content';

import { t } from '#lib/i18n/i18n-strings.ts';
import { getAbsoluteUrl, getContentPath, getSitePath } from '#lib/utils/routing.ts';
import { getOpenGraphId, getOpenGraphImageUrl } from '#lib/utils/seo.ts';

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

export function buildEntrySchemas(
	entry: CollectionEntry<'notes' | 'pages' | 'posts' | 'projects'>,
	props: { authorName: string; description: string | undefined; isArticle: boolean; url: string },
): Array<Thing> {
	const schemas: Array<Thing> = [];

	if (props.isArticle) {
		schemas.push(
			buildArticleSchema({
				dateCreated: entry.data.dateCreated,
				dateUpdated: entry.data.dateUpdated,
				description: props.description,
				imageUrl: getOpenGraphImageUrl(getOpenGraphId(entry.collection, entry.id)),
				title: entry.data.title,
				url: props.url,
			}),
			buildAuthorSchema(props.authorName),
		);
	}

	if (entry.collection !== 'pages') {
		schemas.push(
			buildBreadcrumbSchema(
				[
					{ name: t(`${entry.collection}.title`), url: getContentPath(entry.collection) },
					{ name: entry.data.title },
				],
				props.url,
			),
		);
	}

	return schemas;
}

export function buildWebSiteSchema(props: { description: string; name: string }): WebSite {
	const siteUrl = getAbsoluteUrl(getSitePath());

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

function buildArticleSchema(props: {
	dateCreated: Date;
	dateUpdated: Date | undefined;
	description: string | undefined;
	imageUrl: string | undefined;
	title: string;
	url: string;
}): Article {
	const aboutUrl = getAbsoluteUrl(getSitePath('/about'));
	const articleUrl = getAbsoluteUrl(props.url);

	return {
		'@id': `${articleUrl}${SchemaFragmentIds.Article}`,
		'@type': 'Article',
		headline: props.title,
		...(props.description ? { description: props.description } : {}),
		...(props.imageUrl ? { image: props.imageUrl } : {}),
		datePublished: props.dateCreated.toISOString(),
		...(props.dateUpdated ? { dateModified: props.dateUpdated.toISOString() } : {}),
		author: { '@id': `${aboutUrl}${SchemaFragmentIds.Author}` },
		mainEntityOfPage: { '@id': articleUrl },
	};
}

function buildAuthorSchema(name: string): Person {
	const aboutUrl = getAbsoluteUrl(getSitePath('/about'));

	return {
		'@id': `${aboutUrl}${SchemaFragmentIds.Author}`,
		'@type': 'Person',
		name,
		url: aboutUrl,
	};
}

function buildBreadcrumbSchema(
	items: Array<{ name: string; url?: string }>,
	pageUrl: string,
): BreadcrumbList {
	return {
		'@id': `${getAbsoluteUrl(pageUrl)}${SchemaFragmentIds.Breadcrumb}`,
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem' as const,
			name: item.name,
			position: index + 1,
			...(item.url ? { item: getAbsoluteUrl(item.url) } : {}),
		})),
	};
}
