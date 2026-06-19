import type { RSSFeedItem } from '@astrojs/rss';
import type { ContainerRenderOptions } from 'astro/container';
import type { CollectionEntry } from 'astro:content';

import mdxRenderer from '@astrojs/mdx/server.js';
import { defaultSchema, sanitizeHtml } from '@xsynaptic/unified-tools';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { render } from 'astro:content';
import { performance } from 'node:perf_hooks';
import * as R from 'remeda';

import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { parseContentDate, sortByDateReverseChronological } from '#lib/utils/date.ts';
import { getDescriptionRenderedText } from '#lib/utils/description.ts';
import { getContentUrl } from '#lib/utils/routing.ts';

// AstroContainer.create() logs a deprecation for Astro 7 beta's own default gfm/smartypants
// Here we filter that one line; remove when it is fixed upstream
async function createContainerQuietly() {
	const originalWarn = console.warn;

	console.warn = (...args: Array<unknown>) => {
		const first = args[0];

		if (
			typeof first === 'string' &&
			first.includes('markdown.gfm') &&
			first.includes('deprecated')
		) {
			return;
		}

		originalWarn(...args);
	};

	try {
		return await AstroContainer.create();
	} finally {
		console.warn = originalWarn;
	}
}

async function createRenderMdxFunction() {
	const container = await createContainerQuietly();

	container.addServerRenderer({ name: 'mdx', renderer: mdxRenderer });

	return async function (entry: CollectionEntry<'posts'>, options?: ContainerRenderOptions) {
		const { Content } = await render(entry);

		return await container.renderToString(Content, options);
	};
}

function stripFootnotes(input: string): string {
	let result = input.replaceAll(/<sup><a[^>]*data-footnote-ref[^>]*>.*?<\/a><\/sup>/gi, '');

	result = result.replaceAll(/<section[^>]*data-footnotes[^>]*>.*?<\/section>/gis, '');

	return result;
}

const renderMdx = await createRenderMdxFunction();

const generateFeedItem = async ({
	debug,
	entry,
	excludeFootnotes,
}: {
	debug: boolean;
	entry: CollectionEntry<'posts'>;
	excludeFootnotes: boolean;
}) => {
	const startTime = performance.now();

	const contentHtml = await renderMdx(entry, {
		locals: {
			isRss: true,
		},
	});

	const contentSanitized = sanitizeHtml(
		excludeFootnotes ? stripFootnotes(contentHtml) : contentHtml,
		{
			...defaultSchema,
			tagNames: [...(defaultSchema.tagNames ?? []), 'figure', 'figcaption'],
		},
	);

	const description = getDescriptionRenderedText(entry);

	const feedItem = {
		link: getContentUrl(entry.collection, entry.id),
		pubDate: parseContentDate(entry.data.dateUpdated ?? entry.data.dateCreated),
		title: entry.data.title,
		...(description ? { description } : {}),
		...(contentSanitized ? { content: contentSanitized } : {}),
	} satisfies RSSFeedItem;

	if (debug) {
		console.log(
			`[RSS] Generated entry for "${entry.data.title}" in ${(performance.now() - startTime).toFixed(5)}ms`,
		);
	}

	return feedItem;
};

export async function generateFeedItems({
	debug,
	excludeFootnotes,
	itemCount,
}: {
	debug: boolean;
	excludeFootnotes: boolean;
	itemCount: number;
}) {
	const { entries: posts } = await getPostsCollection();

	return R.pipe(
		await R.pipe([...posts], R.sort(sortByDateReverseChronological), R.take(itemCount), (items) =>
			Promise.all(items.map((item) => generateFeedItem({ debug, entry: item, excludeFootnotes }))),
		),
		R.sort((a, b) => (a.pubDate && b.pubDate ? b.pubDate.getTime() - a.pubDate.getTime() : -1)),
		R.take(itemCount),
	);
}
