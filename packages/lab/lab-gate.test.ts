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
const fullImportPattern = /from\s+['"][^'"]+-full\.astro['"]/;

test.each(components.filter((component) => !component.isFull))(
	'$file ships no script or island outside a -full component',
	({ source }) => {
		expect(source).not.toMatch(processedScriptPattern);
		expect(source).not.toMatch(clientDirectivePattern);
	},
);

test.each(components)('$file imports no stylesheet for its side effect', ({ source }) => {
	expect(source).not.toMatch(stylesheetSideEffectPattern);
});

test.each(components.filter((component) => fullImportPattern.test(component.source)))(
	'$file renders its -full component inside LabGate',
	({ source }) => {
		expect(source).toMatch(/<LabGate[\s>]/);
	},
);
