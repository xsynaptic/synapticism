import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { reportValidationResult, toValidationResult } from '#validate-content/validation-result.ts';

describe('toValidationResult', () => {
	test('passes with the pass summary when nothing is flagged', () => {
		expect(toValidationResult([], { fail: 'Found 0 problem(s)', pass: 'all good' })).toEqual({
			issues: [],
			status: 'pass',
			summary: 'all good',
		});
	});

	test('fails with the fail summary and keeps the issues', () => {
		const issues = [{ message: 'a-post: broken' }];

		expect(toValidationResult(issues, { fail: 'Found 1 problem(s)', pass: 'all good' })).toEqual({
			issues,
			status: 'fail',
			summary: 'Found 1 problem(s)',
		});
	});
});

describe('reportValidationResult', () => {
	// Chalk strips its own styling under vitest, so the lines compare as plain text
	const lines: Array<string> = [];

	beforeEach(() => {
		lines.length = 0;
		vi.spyOn(console, 'log').mockImplementation((line: string) => {
			lines.push(line);
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('prints only the summary when nothing is flagged', () => {
		reportValidationResult({ issues: [], status: 'pass', summary: '2 entry IDs unique' });

		expect(lines).toEqual(['✓ 2 entry IDs unique']);
	});

	test('prints the pass summary, then any notes', () => {
		reportValidationResult({
			issues: [],
			notes: ['   3 carry a featured image'],
			status: 'pass',
			summary: '12 posts checked',
		});

		expect(lines).toEqual(['✓ 12 posts checked', '   3 carry a featured image']);
	});

	test('marks an advisory result as a warning rather than a pass', () => {
		reportValidationResult({
			issues: [],
			status: 'warn',
			summary: 'No image files found in packages/content/media',
		});

		expect(lines).toEqual(['⚠️  No image files found in packages/content/media']);
	});

	test('prints issues above the summary, with details indented', () => {
		reportValidationResult({
			issues: [{ details: ['Line 3: broken link ID "missing"'], message: 'a-post.mdx' }],
			status: 'fail',
			summary: 'Found 1 broken link ID(s)',
		});

		expect(lines).toEqual([
			'❌ a-post.mdx',
			'   Line 3: broken link ID "missing"',
			'⚠️  Found 1 broken link ID(s)',
		]);
	});

	test('marks advisory issues as warnings', () => {
		reportValidationResult({
			issues: [{ message: 'a-post: image has no alt text' }],
			status: 'warn',
			summary: 'Found 1 image warning(s)',
		});

		expect(lines).toEqual(['⚠️  a-post: image has no alt text', '⚠️  Found 1 image warning(s)']);
	});
});
