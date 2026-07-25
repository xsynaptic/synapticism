import type { FontsourceConfig } from '@xsynaptic/og-image-generator';
import type { Font } from 'satori';

import { fontsourceFonts } from '@xsynaptic/og-image-generator';

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

export function loadOgFonts(): Promise<Array<Font>> {
	return fontsourceFonts(fontConfigs, { resolveFrom: import.meta.url });
}
