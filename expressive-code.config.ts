import type { SatteriExpressiveCodeOptions } from 'satteri-expressive-code';

import { readFileSync } from 'node:fs';

const themeColors = new Map(
	readFileSync(new URL('src/styles/main/parts/theme.css', import.meta.url), 'utf8')
		.matchAll(/--color-([\w-]+):\s*([^;]+);/g)
		.map(([, name = '', value = '']) => [name, value.trim()]),
);

function getThemeColor(name: string): string {
	const value = themeColors.get(name);

	if (!value) throw new Error(`Theme colour not found: --color-${name}`);

	const reference = /^var\(--color-([\w-]+)\)$/.exec(value)?.[1];

	return reference ? getThemeColor(reference) : value;
}

// Expressive Code adjusts these for contrast at build, so they must be literals rather than var() reads
const ramp = {
	accent200: getThemeColor('accent-200'),
	accent300: getThemeColor('accent-300'),
	accent400: getThemeColor('accent-400'),
	accent700: getThemeColor('accent-700'),
	highlight300: getThemeColor('highlight-300'),
	highlight400: getThemeColor('highlight-400'),
	primary100: getThemeColor('primary-100'),
	primary200: getThemeColor('primary-200'),
	primary300: getThemeColor('primary-300'),
	primary400: getThemeColor('primary-400'),
	primary600: getThemeColor('primary-600'),
	primary700: getThemeColor('primary-700'),
	primary800: getThemeColor('primary-800'),
	primary900: getThemeColor('primary-900'),
};

const carbonCodeTheme = {
	colors: {
		'editor.background': ramp.primary800,
		'editor.foreground': ramp.primary200,
	},
	name: 'synapticism-carbon',
	tokenColors: [
		{
			scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
			settings: { fontStyle: 'italic', foreground: ramp.primary400 },
		},
		{
			scope: [
				'keyword',
				'storage',
				'storage.type',
				'storage.modifier',
				'keyword.control',
				'keyword.operator.new',
				'keyword.operator.expression',
				'variable.language.this',
			],
			settings: { foreground: ramp.accent300 },
		},
		{
			scope: [
				'string',
				'string.template',
				'string.quoted',
				'punctuation.definition.string',
				'constant.other.symbol',
			],
			settings: { foreground: ramp.highlight300 },
		},
		{
			scope: ['constant.numeric', 'constant.language', 'support.constant'],
			settings: { foreground: ramp.highlight400 },
		},
		{
			scope: [
				'entity.name.type',
				'entity.name.class',
				'support.type',
				'support.class',
				'entity.other.inherited-class',
			],
			settings: { foreground: ramp.accent200 },
		},
		{
			scope: ['entity.name.function', 'support.function', 'meta.function-call.generic'],
			settings: { foreground: ramp.primary100 },
		},
		{
			scope: [
				'variable.parameter',
				'meta.object-literal.key',
				'support.type.property-name',
				'variable.object.property',
			],
			settings: { foreground: ramp.primary300 },
		},
		{
			scope: ['punctuation', 'meta.brace', 'keyword.operator'],
			settings: { foreground: ramp.primary400 },
		},
		{
			scope: ['entity.name.tag', 'punctuation.definition.tag'],
			settings: { foreground: ramp.accent300 },
		},
		{
			scope: ['entity.other.attribute-name'],
			settings: { foreground: ramp.highlight300 },
		},
	],
	type: 'dark',
};

export const expressiveCodeOptions = {
	defaultProps: {
		wrap: false,
	},
	styleOverrides: {
		borderColor: ramp.primary700,
		borderRadius: '0.25rem', // --radius-sm, the system's only radius
		borderWidth: '1px',
		codeFontFamily: 'var(--font-mono)',
		codeFontSize: '0.9rem',
		codeLineHeight: '1.6',
		codePaddingBlock: '1rem',
		codePaddingInline: '1.25rem',
		frames: {
			editorActiveTabBackground: ramp.accent700,
			editorActiveTabBorderColor: 'transparent',
			editorActiveTabForeground: ramp.primary100,
			editorActiveTabIndicatorBottomColor: 'transparent',
			editorActiveTabIndicatorTopColor: ramp.accent400,
			editorBackground: ramp.primary800,
			editorTabBarBackground: ramp.primary900,
			editorTabBarBorderBottomColor: ramp.primary700,
			frameBoxShadowCssValue: 'none',
			inlineButtonBackground: ramp.primary400,
			inlineButtonBorder: ramp.primary600,
			inlineButtonForeground: ramp.primary300,
			terminalBackground: ramp.primary800,
			terminalTitlebarBackground: ramp.primary900,
			terminalTitlebarBorderBottomColor: ramp.primary700,
			terminalTitlebarDotsForeground: ramp.primary600,
			terminalTitlebarForeground: ramp.primary300,
			tooltipSuccessBackground: ramp.accent700,
			tooltipSuccessForeground: '#ffffff',
		},
		scrollbarThumbColor: `${ramp.primary400}40`,
		scrollbarThumbHoverColor: `${ramp.primary400}73`,
		textMarkers: {
			delBackground: 'rgba(200, 120, 110, 0.13)',
			delBorderColor: 'rgba(200, 120, 110, 0.45)',
			delDiffIndicatorColor: '#c8786e',
			insBackground: 'rgba(122, 180, 140, 0.13)',
			insBorderColor: 'rgba(122, 180, 140, 0.45)',
			insDiffIndicatorColor: '#7ab48c',
			markBackground: `${ramp.accent300}21`,
			markBorderColor: `${ramp.accent300}73`,
		},
		uiFontFamily: 'var(--font-mono)',
		uiFontSize: '0.8125rem',
	},
	themes: [carbonCodeTheme],
} satisfies SatteriExpressiveCodeOptions;
