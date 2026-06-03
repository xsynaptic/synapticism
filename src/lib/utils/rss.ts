import type { RSSFeedItem } from '@astrojs/rss';
import type { ContainerRenderOptions } from 'astro/container';
import type { CollectionEntry } from 'astro:content';

import mdxRenderer from '@astrojs/mdx/server.js';
import { defaultSchema, sanitizeHtml, stripTags, transformMarkdown } from '@xsynaptic/unified-tools';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { render } from 'astro:content';
import { performance } from 'node:perf_hooks';
import * as R from 'remeda';

import { getPostsCollection } from '#lib/collections/posts/data.ts';
import { parseContentDate, sortByDateReverseChronological } from '#lib/utils/date.ts';
import { getContentUrl } from '#lib/utils/routing.ts';

function stripFootnotes(input: string): string {
	let result = input.replaceAll(/<sup><a[^>]*data-footnote-ref[^>]*>.*?<\/a><\/sup>/gi, '');

	result = result.replaceAll(/<section[^>]*data-footnotes[^>]*>.*?<\/section>/gis, '');

	return result;
}

async function createRenderMdxFunction() {
	const container = await AstroContainer.create();

	container.addServerRenderer({ name: 'mdx', renderer: mdxRenderer });

	return async function (
		entry: CollectionEntry<'posts'>,
		options?: ContainerRenderOptions,
	) {
		const { Content } = await render(entry);

		return await container.renderToString(Content, options);
	};
}

const renderMdx = await createRenderMdxFunction();

const generateFeedItem = async ({
	entry,
	excludeFootnotes,
	debug,
}: {
	entry: CollectionEntry<'posts'>;
	excludeFootnotes: boolean;
	debug: boolean;
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

	const feedItem = {
		title: entry.data.title,
		link: getContentUrl(entry.collection, entry.id),
		pubDate: parseContentDate(entry.data.dateUpdated ?? entry.data.dateCreated),
		...(entry.data.description
			? { description: stripTags(transformMarkdown({ input: entry.data.description })) }
			: {}),
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
	itemCount,
	excludeFootnotes,
	debug,
}: {
	itemCount: number;
	excludeFootnotes: boolean;
	debug: boolean;
}) {
	const { entries: posts } = await getPostsCollection();

	return R.pipe(
		await R.pipe(
			[...posts],
			R.sort(sortByDateReverseChronological),
			R.take(itemCount),
			(items) =>
				Promise.all(
					items.map((item) => generateFeedItem({ entry: item, excludeFootnotes, debug })),
				),
		),
		R.sort((a, b) => (a.pubDate && b.pubDate ? b.pubDate.getTime() - a.pubDate.getTime() : -1)),
		R.take(itemCount),
	);
}
