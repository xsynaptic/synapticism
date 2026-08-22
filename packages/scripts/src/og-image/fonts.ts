import type { Font } from 'takumi-js';

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

interface FontsourceConfig {
	// Font family name as referenced by `fontFamily` in the template
	name: string;
	// @fontsource package without the scope (e.g. geist-mono)
	package: string;
	variants: Array<FontVariant>;
}

interface FontVariant {
	style: 'italic' | 'normal';
	subset: string;
	weight: number;
}

// The two faces the site itself serves, via Astro's font provider (see astro.config.mjs)
// Only the weights the card renders; every variant is parsed into the renderer
const fontConfigs: Array<FontsourceConfig> = [
	{
		name: 'Aleo',
		package: 'aleo',
		variants: [
			{ style: 'normal', subset: 'latin', weight: 400 },
			{ style: 'normal', subset: 'latin', weight: 600 },
		],
	},
	{
		name: 'Geist Mono',
		package: 'geist-mono',
		variants: [{ style: 'normal', subset: 'latin', weight: 500 }],
	},
];

// @fontsource packages resolve by a computed path, so knip can't see them; see knip.config.ts
const resolver = createRequire(import.meta.url);

export async function loadOgFonts(): Promise<Array<Font>> {
	const fonts: Array<Font> = [];

	for (const config of fontConfigs) {
		for (const variant of config.variants) {
			const filename = `${config.package}-${variant.subset}-${String(variant.weight)}-${variant.style}.woff2`;
			const packageJson = resolver.resolve(`@fontsource/${config.package}/package.json`);
			const data = await readFile(path.join(path.dirname(packageJson), 'files', filename));

			fonts.push({ data, name: config.name, style: variant.style, weight: variant.weight });
		}
	}

	return fonts;
}
