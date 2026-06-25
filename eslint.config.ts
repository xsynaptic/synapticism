import { getAstroConfig, getConfig, getWebComponentConfig } from '@xsynaptic/eslint-config';
import astroPlugin from 'eslint-plugin-astro';
import globals from 'globals';

export default getConfig(
	[
		{
			ignores: [
				'node_modules/**/*',
				'**/.astro/**/*',
				'**/.astro-cache/**/*',
				'**/.cache/**/*',
				'**/dist/**/*',
				'packages/content/**/*',
				'**/temp/**/*',
			],
		},
		{
			rules: {
				// Prefix demand fights idiomatic predicates, getters, schema fields, env (PROD), and CLI flags
				'unicorn/consistent-boolean-name': 'off',
				// We use intentional compounds such as schema.org's WebSite type
				'unicorn/consistent-compound-words': 'off',
				// Zod schema chains in cv.astro legitimately reach 4; depth 5+ still flagged
				'unicorn/max-nested-calls': ['error', { max: 4 }],
				// Conflicts with Remeda's sort function
				'unicorn/no-array-sort': 'off',
			},
		},
		{
			// Sort keys within each group instead of flattening the sections into one alphabetical list
			files: ['src/lib/i18n/**/*.ts'],
			rules: {
				'perfectionist/sort-objects': ['error', { partitionByComment: true, type: 'natural' }],
			},
		},
		// These files run in the browser and might need the browser globals
		{
			files: ['src/components/**/*'],
			languageOptions: {
				globals: {
					...Object.fromEntries(Object.keys(globals.node).map((key) => [key, 'off'])),
					...globals.browser,
				},
			},
			rules: {
				// This conflicts with how some client-side code is handled
				'unicorn/prefer-global-this': 'off',
			},
		},
		getWebComponentConfig(['src/components/**/*.ts']),
		...getAstroConfig({ a11y: astroPlugin.configs['jsx-a11y-strict'] }),
	],
	{
		customGlobals: { mode: 'readonly' },
	},
);
