import { describe, expect, test } from 'vitest';

import { collectReferenceIssues } from './references.js';
import { makeEntry, makeRefs } from './validate-test-utils.js';

// The checked set is whatever collections the passed entries belong to
function issuesFor(subjects: Array<ReturnType<typeof makeEntry>>) {
	return collectReferenceIssues([
		...subjects,
		makeEntry({ collection: 'projects', id: 'some-project' }),
		makeEntry({ collection: 'tags', id: 'urbanism' }),
	]);
}

describe('collectReferenceIssues', () => {
	test('accepts references that resolve', () => {
		expect(
			issuesFor([
				makeEntry({
					data: {
						projects: makeRefs('projects', ['some-project']),
						tags: makeRefs('tags', ['urbanism']),
					},
					id: 'a-post',
				}),
			]),
		).toEqual([]);
	});

	test('flags a reference to a missing entry and reports its field path', () => {
		expect(
			issuesFor([
				makeEntry({
					data: { tags: makeRefs('tags', ['urbanism', 'atlantis']) },
					filePath: 'posts/a-post.mdx',
					id: 'a-post',
				}),
			]),
		).toEqual([
			{ collection: 'tags', field: 'tags[1]', id: 'atlantis', location: 'posts/a-post.mdx' },
		]);
	});

	test('flags a reference whose target exists only in another collection', () => {
		expect(
			issuesFor([makeEntry({ data: { tags: makeRefs('tags', ['some-project']) }, id: 'a-post' })]),
		).toEqual([{ collection: 'tags', field: 'tags[0]', id: 'some-project', location: 'a-post' }]);
	});

	test('flags a reference into a collection with no entries at all', () => {
		expect(
			issuesFor([makeEntry({ data: { pages: makeRefs('pages', ['colophon']) }, id: 'a-post' })]),
		).toEqual([{ collection: 'pages', field: 'pages[0]', id: 'colophon', location: 'a-post' }]);
	});

	test('walks nested objects', () => {
		expect(
			issuesFor([
				makeEntry({ data: { meta: { tags: makeRefs('tags', ['atlantis']) } }, id: 'a-post' }),
			]),
		).toEqual([{ collection: 'tags', field: 'meta.tags[0]', id: 'atlantis', location: 'a-post' }]);
	});

	test('ignores plain data that is not a reference', () => {
		expect(
			issuesFor([
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
