import emoji from 'emojibase-data/en/data.json' with { type: 'json' };
import messages from 'emojibase-data/en/messages.json' with { type: 'json' };
import emojibaseShortcodes from 'emojibase-data/en/shortcodes/emojibase.json' with { type: 'json' };
import githubShortcodes from 'emojibase-data/en/shortcodes/github.json' with { type: 'json' };
import iamcalShortcodes from 'emojibase-data/en/shortcodes/iamcal.json' with { type: 'json' };
import community from 'emojilib' with { type: 'json' };
import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { CatalogSources } from '#emoji-picker/core/catalog-build.ts';

import { parseOverrides } from '#emoji-picker/core/catalog-build.ts';

const catalogLocale = 'en';

const dataDirectory = path.join(import.meta.dirname, '../data');

export function catalogPath(name: 'grid' | 'search') {
	return path.join(dataDirectory, `${name}-${catalogLocale}.json`);
}

export function loadCatalogSources(): CatalogSources {
	return {
		community,
		emoji,
		groups: messages.groups,
		overrides: parseOverrides(readFileSync(path.join(dataDirectory, 'overrides.yaml'), 'utf8')),
		shortcodes: [githubShortcodes, iamcalShortcodes, emojibaseShortcodes],
	};
}
