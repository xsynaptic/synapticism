import {
	getAstroConfig,
	getConfig,
	getWebComponentConfig,
	restrictedSyntaxDefaults,
} from '@xsynaptic/eslint-config';
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
				complexity: ['warn', { max: 8, variant: 'modified' }],
				// Ban logical-assignment shorthand (??=, ||=, &&=); the expanded form reads more clearly
				'logical-assignment-operators': ['error', 'never'],
				// Catches genuinely tangled control flow; unlike `complexity` it ignores JSX ternaries
				'max-depth': ['warn', 3],
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
		// A direct read here would see computed `_` fields or not depending on which wrapper ran first
		{
			files: ['src/lib/collections/**/*.ts'],
			rules: {
				'no-restricted-syntax': [
					'error',
					...restrictedSyntaxDefaults,
					{
						message:
							'Use getRawCollection() from #lib/utils/collections.ts instead of getCollection() inside src/lib/collections.',
						selector: "CallExpression[callee.name='getCollection']",
					},
				],
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
		getWebComponentConfig(['src/components/**/*.ts', 'packages/lab/**/client/**/*.ts']),
		...getAstroConfig({ a11y: 'strict' }),
	],
	{
		customGlobals: { mode: 'readonly' },
	},
);
