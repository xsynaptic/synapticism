import { describe, expect, test } from 'vitest';

import { validateReferences } from './references.js';
import { makeEntry, makeRefs } from './validate-test-utils.js';

// The checked set is whatever collections the passed entries belong to
function makeEntries(subjects: Array<ReturnType<typeof makeEntry>>) {
	return [
		...subjects,
		makeEntry({ collection: 'projects', id: 'some-project' }),
		makeEntry({ collection: 'tags', id: 'urbanism' }),
	];
}

function messagesFor(subjects: Array<ReturnType<typeof makeEntry>>) {
	return validateReferences(makeEntries(subjects)).issues.map((issue) => issue.message);
}

describe('validateReferences', () => {
	test('accepts references that resolve', () => {
		const result = validateReferences(
			makeEntries([
				makeEntry({
					data: {
						projects: makeRefs('projects', ['some-project']),
						tags: makeRefs('tags', ['urbanism']),
					},
					id: 'a-post',
				}),
			]),
		);

		expect(result.status).toBe('pass');
		expect(result.issues).toEqual([]);
	});

	test('flags a reference to a missing entry and reports its field path', () => {
		expect(
			messagesFor([
				makeEntry({
					data: { tags: makeRefs('tags', ['urbanism', 'atlantis']) },
					filePath: 'posts/a-post.mdx',
					id: 'a-post',
				}),
			]),
		).toEqual(['posts/a-post.mdx: tags[1] references "atlantis", missing from "tags"']);
	});

	test('flags a reference whose target exists only in another collection', () => {
		expect(
			messagesFor([
				makeEntry({ data: { tags: makeRefs('tags', ['some-project']) }, id: 'a-post' }),
			]),
		).toEqual(['a-post: tags[0] references "some-project", missing from "tags"']);
	});

	test('flags a reference into a collection with no entries at all', () => {
		expect(
			messagesFor([makeEntry({ data: { pages: makeRefs('pages', ['colophon']) }, id: 'a-post' })]),
		).toEqual(['a-post: pages[0] references "colophon", missing from "pages"']);
	});

	test('walks nested objects', () => {
		expect(
			messagesFor([
				makeEntry({ data: { meta: { tags: makeRefs('tags', ['atlantis']) } }, id: 'a-post' }),
			]),
		).toEqual(['a-post: meta.tags[0] references "atlantis", missing from "tags"']);
	});

	test('ignores plain data that is not a reference', () => {
		expect(
			messagesFor([
				makeEntry({
					data: {
						links: [{ url: 'https://example.test' }],
						title: 'A Post',
						years: [2024, 2025],
					},
					id: 'a-post',
				}),
			]),
		).toEqual([]);
	});
});
