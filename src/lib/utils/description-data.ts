import { createSqliteCache } from '@synapticism/shared/cache';
import { CUSTOM_CACHE_PATH } from 'astro:env/server';

import type { DescriptionEntry } from '#lib/utils/description.ts';

import { createDescriptionRenderers } from '#lib/utils/description.ts';

let descriptionRenderers: ReturnType<typeof createDescriptionRenderers> | undefined;

export function getDescriptionRenderedHtml(entry: DescriptionEntry) {
	return getDescriptionRenderers().getDescriptionRenderedHtml(entry);
}

export function getDescriptionRenderedText(entry: DescriptionEntry) {
	return getDescriptionRenderers().getDescriptionRenderedText(entry);
}

function getDescriptionRenderers() {
	if (!descriptionRenderers) {
		descriptionRenderers = createDescriptionRenderers({
			cache: createSqliteCache(CUSTOM_CACHE_PATH, 'description-rendered'),
		});
	}
	return descriptionRenderers;
}
