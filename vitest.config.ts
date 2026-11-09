import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Vitest replaces `defaultExclude` rather than merging, so `.git` must be restated here
		exclude: ['**/node_modules/**', '**/.git/**', '.claude/worktrees/**', 'dist/**', 'verify/**'],
	},
});
