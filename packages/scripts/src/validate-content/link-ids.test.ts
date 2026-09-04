import { describe, expect, test } from 'vitest';

import { collectLinkIdIssues, validateLinkIds } from './link-ids.js';
import { makeEntry } from './validate-test-utils.js';

const rootPath = import.meta.dirname;

const targets = [makeEntry({ id: 'a-note' }), makeEntry({ id: 'a-project' })];

describe('collectLinkIdIssues', () => {
	test('accepts a link whose id resolves', () => {
		const entries = [
			makeEntry({ body: 'Filed under <Link id="a-note">a note</Link>.', id: 'a-post' }),
		];

		expect(collectLinkIdIssues(entries, targets)).toEqual([]);
	});

	test('flags a link whose id resolves to nothing, with its line number', () => {
		const entries = [
			makeEntry({
				body: 'First line.\n\nSee <Link id="nobody">nobody</Link>.',
				filePath: 'collections/posts/a-post.mdx',
				id: 'a-post',
			}),
		];

		expect(collectLinkIdIssues(entries, targets)).toEqual([
			{ id: 'nobody', lineNumber: 3, location: 'collections/posts/a-post.mdx' },
		]);
	});

	test('reads a self-closing link', () => {
		const entries = [
			makeEntry({
				body: '<Link id="a-note" />\n<Link id="nobody" />',
				filePath: 'collections/posts/a-post.mdx',
				id: 'a-post',
			}),
		];

		expect(collectLinkIdIssues(entries, targets)).toEqual([
			{ id: 'nobody', lineNumber: 2, location: 'collections/posts/a-post.mdx' },
		]);
	});

	test('skips an entry with no body and one with no Link at all', () => {
		const entries = [makeEntry({ id: 'a-tag' }), makeEntry({ body: 'Plain prose.', id: 'a-post' })];

		expect(collectLinkIdIssues(entries, targets)).toEqual([]);
	});

	test('reads a single-quoted id', () => {
		const entries = [makeEntry({ body: "<Link id='nobody' />", id: 'a-post' })];

		expect(collectLinkIdIssues(entries, targets).map((issue) => issue.id)).toEqual(['nobody']);
	});

	test('does not read a `data-id` prop as a link id', () => {
		const entries = [makeEntry({ body: '<Link data-id="nobody">text</Link>', id: 'a-post' })];

		expect(collectLinkIdIssues(entries, targets)).toEqual([]);
	});
});

describe('validateLinkIds', () => {
	test('groups every broken link in one entry under a single issue', () => {
		const body = ['<Link id="nobody" />', '<Link id="nobody-else" />'].join('\n');
		const result = validateLinkIds([makeEntry({ body, id: 'a-post' })], targets, rootPath);

		expect(result.issues).toEqual([
			{
				details: ['Line 1: broken link ID "nobody"', 'Line 2: broken link ID "nobody-else"'],
				message: 'a-post',
			},
		]);
	});

	test('reports a line number that points at the file, not the body', () => {
		const body = [
			'Prose above the component.',
			'',
			'<Link>no id here</Link>',
			'',
			'<Link id="a-missing-target">a dangling id</Link>',
			'',
		].join('\n');
		const entries = [makeEntry({ body, filePath: 'fixtures/offset-sample.mdx', id: 'a-post' })];

		const result = validateLinkIds(entries, targets, rootPath);

		expect(result.issues[0]?.details).toEqual(['Line 11: broken link ID "a-missing-target"']);
	});
});
