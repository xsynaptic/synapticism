import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { getProjectsCollection } from '#lib/collections/projects/projects-data.ts';
import { sortByDateReverseChronological } from '#lib/utils/date.ts';

export async function queryPostAndProjectEntries() {
	const [{ entries: posts }, { entries: projects }] = await Promise.all([
		getPostsCollection(),
		getProjectsCollection(),
	]);

	return [...posts, ...projects].toSorted(sortByDateReverseChronological);
}
