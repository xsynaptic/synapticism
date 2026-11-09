import type { SyndicationItem, SyndicationPublication } from '@xsynaptic/astro-syndication';
import type { CollectionEntry } from 'astro:content';

import mdxRenderer from '@astrojs/mdx/server.js';
import { getImageFeaturedId } from '@synapticism/shared/image-featured';
import { anchorDateOnly, toSyndicationImage } from '@xsynaptic/astro-syndication';
import { prepareSyndicationHtml } from '@xsynaptic/astro-syndication/html';
import { createSyndicationRenderer } from '@xsynaptic/astro-syndication/render';
import { stripTags } from '@xsynaptic/unified-tools';
import { getImage } from 'astro:assets';
import { render } from 'astro:content';
import * as R from 'remeda';

import { siteAuthorName, siteTimezoneOffsetHours, syndicationItemCount } from '#constants.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { createTagsByIdsFunction } from '#lib/collections/tags/tags-utils.ts';
import { t } from '#lib/i18n/i18n-strings.ts';
import { getCopyrightYears, sortByDateReverseChronological } from '#lib/utils/date.ts';
import { getDescriptionRenderedText } from '#lib/utils/description-data.ts';
import { getMediaImage } from '#lib/utils/media.ts';
import { getAbsoluteUrl, getContentPath } from '#lib/utils/routing.ts';
import { formatStringTemplate, stripFootnotes } from '#lib/utils/text.ts';

const site = new URL(import.meta.env.SITE);

const renderFeed = await createSyndicationRenderer({
	renderers: [{ name: 'mdx', renderer: mdxRenderer }],
	site,
});

const syndicationImageWidth = 1200;

const syndicationAuthors = [{ name: siteAuthorName }];

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
		width: syndicationImageWidth,
	});

	return toSyndicationImage(image, {
		alt: stripTags((typeof featured === 'object' ? featured.title : undefined) ?? title),
	});
}

async function getSyndicationItem({
	entry,
	getTagsByIds,
}: {
	entry: CollectionEntry<'posts'>;
	getTagsByIds: Awaited<ReturnType<typeof createTagsByIdsFunction>>;
}) {
	const { data } = entry;

	const { Content } = await render(entry);
	const contentHtml = prepareSyndicationHtml(stripFootnotes(await renderFeed(Content)), { site });
	const description = getDescriptionRenderedText(entry);
	const image = await getSyndicationImage(data);

	return {
		authors: syndicationAuthors,
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

export async function getSyndicationItems() {
	const { entries: posts } = await getPostsCollection();
	const getTagsByIds = await createTagsByIdsFunction();

	return Promise.all(
		R.pipe(posts, R.sort(sortByDateReverseChronological), R.take(syndicationItemCount)).map(
			(entry) => getSyndicationItem({ entry, getTagsByIds }),
		),
	);
}

export function getSyndicationPublication(site: SyndicationPublication['site']) {
	return {
		copyright: formatStringTemplate(t('footer.copyright'), { years: getCopyrightYears() }),
		description: t('site.description'),
		language: 'en-us',
		site,
		title: t('site.title'),
	} satisfies SyndicationPublication;
}
