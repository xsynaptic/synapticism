import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['packages/scripts/src/**/*.test.ts', 'src/**/*.test.ts'],
	},
});
