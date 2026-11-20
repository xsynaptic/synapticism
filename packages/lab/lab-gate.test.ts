import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

const components = globSync('**/*.astro', {
	cwd: import.meta.dirname,
	exclude: ['**/node_modules/**'],
}).map((file) => ({
	file,
	isFull: file.endsWith('-full.astro'),
	source: readFileSync(path.join(import.meta.dirname, file), 'utf8'),
}));

const processedScriptPattern = /<script(?![^>]*(?:is:inline|define:vars))[^>]*>/;
const clientDirectivePattern = /\sclient:[a-z]+/;
const stylesheetSideEffectPattern = /^import\s+['"][^'"]+\.css['"]/m;
const stylesheetUrlPattern = /from\s+['"][^'"]+\.css\?url['"]/;
const fullImportPattern = /from\s+['"][^'"]+-full\.astro['"]/;
const fullImportNamePattern = /import\s+(\w+)\s+from\s+['"][^'"]+-full\.astro['"]/;
const gatedPattern = /<LabGate[\s>][\s\S]*?<\/LabGate>/g;

test.each(components.filter((component) => !component.isFull))(
	'$file ships no script or island outside a -full component',
	({ source }) => {
		expect(source).not.toMatch(processedScriptPattern);
		expect(source).not.toMatch(clientDirectivePattern);
	},
);

test.each(components)('$file imports a stylesheet only with ?inline', ({ source }) => {
	expect(source).not.toMatch(stylesheetSideEffectPattern);
	expect(source).not.toMatch(stylesheetUrlPattern);
});

test.each(components.filter((component) => fullImportPattern.test(component.source)))(
	'$file renders its -full component inside LabGate',
	({ source }) => {
		const [, fullName = ''] = fullImportNamePattern.exec(source) ?? [];
		const fullTag = new RegExp(String.raw`<${fullName}[\s/>]`);
		const gated = source.match(gatedPattern)?.join('') ?? '';

		expect(fullName).not.toBe('');
		expect(gated).toMatch(fullTag);
		expect(source.replaceAll(gatedPattern, '')).not.toMatch(fullTag);
	},
);
