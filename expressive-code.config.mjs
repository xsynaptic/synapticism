// @ts-check

// Brand ramp hex used by the code theme, mirroring src/styles/theme/colors.css
// Shiki resolves and does color math on these at build, so they must be literals
const ramp = {
	accent200: '#b7e6ea',
	accent300: '#85d3db',
	accent600: '#2b7e8f',
	accent700: '#296775',
	highlight300: '#e8a578',
	highlight400: '#dd8048',
	primary100: '#f4f4f5',
	primary200: '#e4e4e7',
	primary300: '#d4d4d8',
	primary400: '#a1a1aa',
	primary600: '#52525b',
	primary700: '#3f3f46',
	primary800: '#27272a',
	primary900: '#18181b',
};

// Carbon code-block theme: a dark slab matching the masthead, syntax mapped to the brand ramps
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
			settings: { foreground: ramp.primary100 }, // functions pop by brightness
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
			settings: { foreground: ramp.primary400 }, // quiet operators and brackets
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

/** @type {import('satteri-expressive-code').SatteriExpressiveCodeOptions} */
export const expressiveCodeOptions = {
	defaultProps: {
		wrap: false,
	},
	styleOverrides: {
		borderColor: ramp.primary700, // faint machined edge
		borderRadius: '0.25rem', // --radius-sm, the system's only radius
		borderWidth: '1px',
		codeFontFamily: 'var(--font-mono)',
		codeFontSize: '0.9rem',
		codeLineHeight: '1.6',
		codePaddingBlock: '1rem',
		codePaddingInline: '1.25rem',
		frames: {
			editorActiveTabBackground: ramp.primary900,
			editorActiveTabBorderColor: 'transparent',
			editorActiveTabForeground: ramp.primary300,
			editorActiveTabIndicatorBottomColor: 'transparent',
			editorActiveTabIndicatorTopColor: ramp.accent600, // teal spark on the tab
			editorBackground: ramp.primary800,
			editorTabBarBackground: ramp.primary900,
			editorTabBarBorderBottomColor: ramp.primary700,
			frameBoxShadowCssValue: 'none', // no floating-card shadow
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
		scrollbarThumbColor: 'rgba(161, 161, 170, 0.25)', // primary-400 at low alpha
		scrollbarThumbHoverColor: 'rgba(161, 161, 170, 0.45)',
		textMarkers: {
			delBackground: 'rgba(200, 120, 110, 0.13)', // muted red diff
			delBorderColor: 'rgba(200, 120, 110, 0.45)',
			delDiffIndicatorColor: '#c8786e',
			insBackground: 'rgba(122, 180, 140, 0.13)', // muted green diff (semantic exception)
			insBorderColor: 'rgba(122, 180, 140, 0.45)',
			insDiffIndicatorColor: '#7ab48c',
			markBackground: 'rgba(133, 211, 219, 0.13)', // teal line highlight
			markBorderColor: 'rgba(133, 211, 219, 0.45)',
		},
		uiFontFamily: 'var(--font-mono)',
		uiFontSize: '0.8125rem',
	},
	themes: [carbonCodeTheme],
};
