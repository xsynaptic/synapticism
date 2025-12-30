import type { CollectionEntry } from 'astro:content';

import { getCollection } from 'astro:content';
import { performance } from 'node:perf_hooks';

interface CollectionData {
	posts: Array<CollectionEntry<'posts'>>;
}

let collection: Promise<CollectionData> | undefined;

export async function getPostsCollection() {
	if (!collection) {
		collection = generateCollection();
	}
	return collection;
}

async function generateCollection() {
	const startTime = performance.now();

	const posts = await getCollection('posts');

	console.log(
		`[Posts] Collection data generated in ${(performance.now() - startTime).toFixed(5)}ms`,
	);

	return { posts };
}
