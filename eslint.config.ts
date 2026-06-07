import { getAstroConfig, getConfig, getWebComponentConfig } from '@xsynaptic/eslint-config';
import astroPlugin from 'eslint-plugin-astro';
import globals from 'globals';

const isStrictLint = process.env.ESLINT_STRICT === '1';

export default getConfig(
	[
		{
			ignores: [
				'node_modules/**/*',
				'**/.astro/**/*',
				'**/.astro-cache/**/*',
				'**/.cache/**/*',
				'**/dist/**/*',
				'deploy/**/*',
				'packages/content/**/*',
				'**/temp/**/*',
			],
		},
		{
			rules: {
				// Expensive type-aware rules; only run in strict mode
				'@typescript-eslint/no-deprecated': isStrictLint ? 'error' : 'off',
				'@typescript-eslint/no-misused-promises': isStrictLint ? 'error' : 'off',
				'@typescript-eslint/no-unsafe-assignment': isStrictLint ? 'error' : 'off',
				// Conflicts with Remeda's sort function
				'unicorn/no-array-sort': 'off',
			},
		},
		// These files run in the browser and might need the browser globals
		{
			files: ['src/components/**/*'],
			languageOptions: {
				globals: {
					...Object.fromEntries(Object.entries(globals.node).map(([key]) => [key, 'off'])),
					...globals.browser,
				},
			},
			rules: {
				// This conflicts with how some client-side code is handled
				'unicorn/prefer-global-this': 'off',
			},
		},
		getWebComponentConfig(['src/components/**/*.ts']),
		{
			files: ['src/components/**/*.ts'],
			rules: {
				// Redundant under strict TS; the project avoids custom-element inheritance entirely
				'wc/guard-super-call': 'off',
			},
		},
		...getAstroConfig({ a11y: astroPlugin.configs['jsx-a11y-strict'] }),
	],
	{
		customGlobals: { mode: 'readonly' },
	},
);
