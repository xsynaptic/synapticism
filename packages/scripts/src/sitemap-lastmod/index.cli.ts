#!/usr/bin/env tsx
import { parseArgs } from 'node:util';

import { findWorkspaceRoot } from '../shared/utils.js';
import { generateSitemapLastmod } from './index.js';

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		// Mirrors sitemapLastmodPath in src/lib/utils/sitemap.ts, which reads the file back
		'output-path': { default: '.cache/sitemap-lastmod.json', type: 'string' },
	},
});

await generateSitemapLastmod({
	outputPath: values['output-path'],
	rootPath: findWorkspaceRoot(),
});
