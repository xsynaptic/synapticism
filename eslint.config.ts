import {
	getAstroConfig,
	getBrowserConfig,
	getConfig,
	getWebComponentConfig,
	restrictedSyntaxDefaults,
} from '@xsynaptic/eslint-config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default getConfig(
	[
		{
			ignores: [
				'node_modules/**/*',
				'.claude/**/*',
				'**/.astro/**/*',
				'**/.astro-cache/**/*',
				'**/.cache/**/*',
				'**/.wrangler/**/*',
				'**/dist/**/*',
				'packages/content/{collections,data,media}/**/*',
				'**/temp/**/*',
			],
		},
		{
			rules: {
				'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
				'max-statements': ['warn', 20],
				// Prefix demand fights idiomatic predicates, getters, schema fields, env (PROD), and CLI flags
				'unicorn/consistent-boolean-name': 'off',
				// Zod schema chains in cv.astro legitimately reach 4; depth 5+ still flagged
				'unicorn/max-nested-calls': ['error', { max: 4 }],
				// The shared config turns this off for a Remeda `R.sort` conflict the rule no longer has
				'unicorn/no-array-sort': 'error',
			},
		},
		{
			// Sort keys within each group instead of flattening the sections into one alphabetical list
			files: ['src/lib/i18n/**/*.ts'],
			rules: {
				'perfectionist/sort-objects': ['error', { partitionByComment: true, type: 'natural' }],
			},
		},
		{
			...reactHooks.configs.flat.recommended,
			files: ['packages/lab/**/*.tsx'],
		},
		getBrowserConfig(['src/components/**/*']),
		{
			files: ['**/*.astro/*.{js,ts}', 'src/components/**/*.{ts,tsx}', 'packages/lab/**/*.{ts,tsx}'],
			ignores: ['**/*.test.{ts,tsx}'],
			rules: {
				'no-restricted-properties': [
					'error',
					...['toReversed', 'toSorted', 'toSpliced', 'with'].map((property) => ({
						message: 'Copy then mutate instead (`[...array].sort()`)',
						property,
					})),
				],
				'unicorn/no-array-reverse': 'off',
				'unicorn/no-array-sort': 'off',
			},
		},
		{
			files: ['packages/scripts/src/**/*.{ts,tsx}'],
			rules: {
				'no-console': 'error',
				'no-restricted-syntax': [
					'error',
					...restrictedSyntaxDefaults,
					{
						message: '`runCommand` owns exit codes; throw a `UserError` instead',
						selector: "CallExpression[callee.object.name='process'][callee.property.name='exit']",
					},
				],
			},
		},
		{
			files: ['verify/e2e/**/*', 'playwright.config.ts'],
			languageOptions: {
				globals: { ...globals.node, ...globals.browser },
			},
			rules: {
				'unicorn/prefer-global-this': 'off',
			},
		},
		getWebComponentConfig(['src/components/**/*.ts', 'packages/lab/**/client/**/*.ts']),
		...getAstroConfig({ a11y: 'strict' }),
	],
	{
		customGlobals: { mode: 'readonly' },
	},
);
