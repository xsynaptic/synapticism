import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { getCollectionMock } = vi.hoisted(() => ({ getCollectionMock: vi.fn() }));

vi.mock('astro:content', () => ({ getCollection: getCollectionMock }));

function makeEntry(collection: string, id: string, data: Record<string, unknown> = {}) {
	return { collection, data: { title: id, ...data }, id };
}

function makeStore() {
	return {
		notes: [makeEntry('notes', 'note', { tags: [{ id: 'astro' }] })],
		posts: [
			makeEntry('posts', 'post', { tags: [{ id: 'astro' }, { id: 'typescript' }] }),
			makeEntry('posts', 'untagged'),
		],
		projects: [makeEntry('projects', 'project', { tags: [{ id: 'astro' }] })],
		tags: [
			makeEntry('tags', 'astro'),
			makeEntry('tags', 'typescript'),
			makeEntry('tags', 'unused'),
		],
	};
}

let store: ReturnType<typeof makeStore>;

beforeEach(() => {
	vi.resetModules();
	vi.stubEnv('DEV', false);
	vi.spyOn(console, 'log').mockImplementation(vi.fn());

	store = makeStore();
	getCollectionMock.mockImplementation((collection: keyof typeof store) =>
		Promise.resolve(store[collection]),
	);
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

async function loadWrappers() {
	const tags = await import('#lib/collections/tags/tags-data.ts');

	return { tags: await tags.getTagsCollection() };
}

describe('collection wrappers', () => {
	test('never write the content store', async () => {
		const snapshot = structuredClone(store);

		await loadWrappers();

		expect(store).toEqual(snapshot);
	});

	test('count tagged entries across posts, notes and projects', async () => {
		const { tags } = await loadWrappers();

		expect(tags.entries.map(({ data, id }) => [id, data._entryCount])).toEqual([
			['astro', 3],
			['typescript', 1],
			['unused', 0],
		]);
	});
});
