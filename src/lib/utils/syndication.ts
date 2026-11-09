import type { SyndicationItem } from '@xsynaptic/astro-syndication';
import type { CollectionEntry } from 'astro:content';

import mdxRenderer from '@astrojs/mdx/server.js';
import { getImageFeaturedId } from '@synapticism/shared/image-featured';
import { anchorDateOnly, toSyndicationImage } from '@xsynaptic/astro-syndication';
import { prepareSyndicationHtml } from '@xsynaptic/astro-syndication/html';
import { createSyndicationRenderer } from '@xsynaptic/astro-syndication/render';
import { stripTags } from '@xsynaptic/unified-tools';
import { getImage } from 'astro:assets';
import { render } from 'astro:content';
import { performance } from 'node:perf_hooks';
import * as R from 'remeda';

import { siteAuthorName, siteTimezoneOffsetHours } from '#constants.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { createTagsByIdsFunction } from '#lib/collections/tags/tags-utils.ts';
import { sortByDateReverseChronological } from '#lib/utils/date.ts';
import { getDescriptionRenderedText } from '#lib/utils/description-data.ts';
import { getMediaImage } from '#lib/utils/media.ts';
import { getAbsoluteUrl, getContentPath } from '#lib/utils/routing.ts';
import { stripFootnotes } from '#lib/utils/text.ts';

const site = new URL(import.meta.env.SITE);

const renderFeed = await createSyndicationRenderer({
	renderers: [{ name: 'mdx', renderer: mdxRenderer }],
	site,
});

const feedImageWidth = 1200;

const feedAuthors = [{ name: siteAuthorName }];

function getSiteDate(date: Date) {
	return anchorDateOnly(date, { utcOffsetHours: siteTimezoneOffsetHours });
}

async function getSyndicationImage({ imageFeatured, title }: CollectionEntry<'posts'>['data']) {
	const imageId = getImageFeaturedId(imageFeatured);

	if (!imageId) return;

	const featured = Array.isArray(imageFeatured) ? imageFeatured[0] : imageFeatured;
	const image = await getImage({
		format: 'jpg',
		src: getMediaImage(imageId),
		width: feedImageWidth,
	});

	return toSyndicationImage(image, {
		alt: stripTags((typeof featured === 'object' ? featured.title : undefined) ?? title),
	});
}

async function getSyndicationContentHtml(
	entry: CollectionEntry<'posts'>,
	{ excludeFootnotes }: { excludeFootnotes: boolean },
) {
	const { Content } = await render(entry);
	const renderedHtml = await renderFeed(Content);

	return prepareSyndicationHtml(excludeFootnotes ? stripFootnotes(renderedHtml) : renderedHtml, {
		site,
	});
}

async function getSyndicationItem({
	debug,
	entry,
	excludeFootnotes,
	getTagsByIds,
}: {
	debug: boolean;
	entry: CollectionEntry<'posts'>;
	excludeFootnotes: boolean;
	getTagsByIds: Awaited<ReturnType<typeof createTagsByIdsFunction>>;
}) {
	const startTime = performance.now();
	const { data } = entry;

	const contentHtml = await getSyndicationContentHtml(entry, { excludeFootnotes });
	const description = getDescriptionRenderedText(entry);
	const image = await getSyndicationImage(data);

	if (debug) {
		console.log(
			`[RSS] Generated entry for "${data.title}" in ${(performance.now() - startTime).toFixed(5)}ms`,
		);
	}

	return {
		authors: feedAuthors,
		dateCreated: getSiteDate(data.dateCreated),
		tags: getTagsByIds(data.tags?.map(({ id }) => id) ?? []).map((tag) => tag.data.title),
		title: data.title,
		url: getAbsoluteUrl(getContentPath('posts', entry.id)),
		...(contentHtml ? { contentHtml } : {}),
		...(data.dateUpdated ? { dateUpdated: getSiteDate(data.dateUpdated) } : {}),
		...(description ? { description } : {}),
		...(image ? { image } : {}),
	} satisfies SyndicationItem;
}

export async function getSyndicationItems({
	debug,
	excludeFootnotes,
	itemCount,
}: {
	debug: boolean;
	excludeFootnotes: boolean;
	itemCount: number;
}) {
	const { entries: posts } = await getPostsCollection();
	const getTagsByIds = await createTagsByIdsFunction();

	return Promise.all(
		R.pipe(posts, R.sort(sortByDateReverseChronological), R.take(itemCount)).map((entry) =>
			getSyndicationItem({ debug, entry, excludeFootnotes, getTagsByIds }),
		),
	);
}
