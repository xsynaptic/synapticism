import type { FontsourceConfig } from '@xsynaptic/og-image-generator';
import type { Font } from 'satori';

import { fontsourceFonts } from '@xsynaptic/og-image-generator';

const fontConfigs: Array<FontsourceConfig> = [
	{
		name: 'Geist',
		package: 'geist',
		variants: [
			{ style: 'normal', subset: 'latin', weight: 400 },
			{ style: 'normal', subset: 'latin', weight: 700 },
		],
	},
];

export function loadOgFonts(): Promise<Array<Font>> {
	return fontsourceFonts(fontConfigs, { resolveFrom: import.meta.url });
}
