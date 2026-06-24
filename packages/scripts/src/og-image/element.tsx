/** @jsxRuntime automatic */
/** @jsxImportSource satori/jsx */
import type { OgElement } from '@xsynaptic/og-image-generator';

import { OG_HEIGHT, OG_WIDTH } from './constants.js';

const colors = {
	carbon: '#27272a',
	ink: '#f4f4f5',
	mark: '#a1a1aa',
	teal: '#2b7e8f',
} as const;

export function getOgElement(title: string): OgElement {
	return (
		<div
			style={{
				backgroundColor: colors.carbon,
				display: 'flex',
				flexDirection: 'column',
				height: OG_HEIGHT,
				justifyContent: 'space-between',
				padding: 80,
				width: OG_WIDTH,
			}}
		>
			<div
				style={{
					backgroundColor: colors.teal,
					borderRadius: 2,
					display: 'flex',
					height: 8,
					width: 120,
				}}
			/>
			<div
				style={{
					color: colors.ink,
					display: 'flex',
					fontFamily: 'Geist',
					fontSize: titleFontSize(title.length),
					fontWeight: 700,
					letterSpacing: '-0.02em',
					lineClamp: 4,
					lineHeight: 1.1,
				}}
			>
				{title}
			</div>
			<div
				style={{
					color: colors.mark,
					display: 'flex',
					fontFamily: 'Geist',
					fontSize: 24,
					fontWeight: 400,
					letterSpacing: '4px',
				}}
			>
				SYNAPTICISM
			</div>
		</div>
	);
}

// Scale the title down as it lengthens so short titles stay punchy and long ones still fit
function titleFontSize(length: number): number {
	if (length <= 32) return 72;
	if (length <= 64) return 60;
	if (length <= 96) return 48;
	return 40;
}
