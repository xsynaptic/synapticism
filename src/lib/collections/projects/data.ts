import type { CollectionEntry } from 'astro:content';

import { getCollection } from 'astro:content';
import { performance } from 'node:perf_hooks';

interface CollectionData {
	projects: Array<CollectionEntry<'projects'>>;
}

let collection: Promise<CollectionData> | undefined;

export async function getProjectsCollection() {
	if (!collection) {
		collection = generateCollection();
	}
	return collection;
}

async function generateCollection() {
	const startTime = performance.now();

	const projects = await getCollection('projects');

	console.log(
		`[Projects] Collection data generated in ${Number(performance.now() - startTime).toFixed(5)}ms`,
	);

	return { projects };
}
