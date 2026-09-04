import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Vitest 4 replaces `defaultExclude` rather than merging, so `.git` must be restated here
		exclude: ['**/node_modules/**', '**/.git/**', 'dist/**'],
	},
});
