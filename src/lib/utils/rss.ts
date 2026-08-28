import type { RSSFeedItem } from '@astrojs/rss';
import type { ContainerRenderOptions } from 'astro/container';
import type { CollectionEntry } from 'astro:content';

import mdxRenderer from '@astrojs/mdx/server.js';
import { defaultSchema, sanitizeHtml } from '@xsynaptic/unified-tools';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { render } from 'astro:content';
import { performance } from 'node:perf_hooks';
import * as R from 'remeda';

import { millisecondsPerHour, siteTimezoneOffsetHours } from '#constants.ts';
import { getNotesCollection } from '#lib/collections/notes/notes-data.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { parseContentDate, sortByDateReverseChronological } from '#lib/utils/date.ts';
import { getDescriptionRenderedText } from '#lib/utils/description.ts';
import { getContentUrl } from '#lib/utils/routing.ts';
import { stripFootnotes } from '#lib/utils/text.ts';

type FeedEntry = CollectionEntry<'notes'> | CollectionEntry<'posts'>;

async function createRenderMdxFunction() {
	const container = await AstroContainer.create();

	container.addServerRenderer({ name: 'mdx', renderer: mdxRenderer });

	return async function (entry: FeedEntry, options?: ContainerRenderOptions) {
		const { Content } = await render(entry);

		return await container.renderToString(Content, options);
	};
}

const renderMdx = await createRenderMdxFunction();

const generateFeedItem = async ({
	debug,
	entry,
	excludeFootnotes,
}: {
	debug: boolean;
	entry: FeedEntry;
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

	const pubDate = parseContentDate(entry.data.dateUpdated ?? entry.data.dateCreated);

	const feedItem = {
		link: getContentUrl(entry.collection, entry.id),
		// Dates sit at 00:00 UTC; re-anchor to the site timezone so today's entries are never future-dated
		pubDate: pubDate
			? new Date(pubDate.getTime() - siteTimezoneOffsetHours * millisecondsPerHour)
			: undefined,
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
	const [{ entries: posts }, { entries: notes }] = await Promise.all([
		getPostsCollection(),
		getNotesCollection(),
	]);

	return R.pipe(
		await R.pipe(
			[...posts, ...notes],
			R.sort(sortByDateReverseChronological),
			R.take(itemCount),
			(items) =>
				Promise.all(
					items.map((item) => generateFeedItem({ debug, entry: item, excludeFootnotes })),
				),
		),
		R.sort((a, b) => (a.pubDate && b.pubDate ? b.pubDate.getTime() - a.pubDate.getTime() : -1)),
		R.take(itemCount),
	);
}
