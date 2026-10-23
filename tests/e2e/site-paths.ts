import type { APIRequestContext } from '@playwright/test';

import { contentManifestPath } from '#e2e/constants.ts';

export interface SitePaths {
	postDetail: string;
	postTitle: string;
}

interface CatalogItem {
	title: string;
	url: string;
}

let discovered: Promise<SitePaths> | undefined;

// The request context this was built from is disposed after that test; the resolved value is not
export function getSitePaths(request: APIRequestContext): Promise<SitePaths> {
	if (!discovered) discovered = discover(request);

	return discovered;
}

async function discover(request: APIRequestContext): Promise<SitePaths> {
	const response = await request.get(contentManifestPath);
	const manifest = (await response.json()) as Array<CatalogItem>;
	const post = manifest.find((item) => isDetailPath(item.url, 'posts'));

	if (!post) throw new Error('The content manifest names no Post');

	return { postDetail: post.url, postTitle: post.title };
}

function isDetailPath(url: string, collection: string): boolean {
	return new RegExp(`^/${collection}/[^/]+/$`).test(url);
}
