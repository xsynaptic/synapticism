import { getConfig } from '@xsynaptic/eslint-config';
import globals from 'globals';

export default getConfig(
	[
		{
			ignores: ['**/.astro', '**/.astro-cache', 'dist/**/*'],
		},
		// Those files run in the browser and need the browser globals
		{
			files: ['src/components/*'],
			languageOptions: {
				globals: {
					...Object.fromEntries(Object.entries(globals.node).map(([key]) => [key, 'off'])),
					...globals.browser,
				},
			},
		},
	],
	{ withAstro: true },
);
