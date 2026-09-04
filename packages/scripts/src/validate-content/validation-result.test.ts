import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { reportValidationResult } from './validation-result.js';

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
});
