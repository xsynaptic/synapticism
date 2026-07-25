/** @jsxRuntime automatic */
/** @jsxImportSource satori/jsx */
import type { OgElement } from '@xsynaptic/og-image-generator';

import type { OgImageEntry } from './content.js';

import {
	OG_HEIGHT,
	OG_PADDING_FULL,
	OG_PADDING_SPLIT,
	OG_PANEL_WIDTH,
	OG_SEAM_WIDTH,
	OG_WIDTH,
} from './constants.js';

// Mirrors src/styles/main/theme.css; scale positions given so they trace back to the site
const colors = {
	accent: '#2b7e8f', // accent-600
	accentBright: '#4cb6c4', // accent-400, readable on carbon
	carbon: '#27272a', // primary-800, the site background
	muted: '#a1a1aa', // primary-400
	surface: '#f4f4f5', // primary-100, the reading surface
} as const;

export function getOgElement(entry: OgImageEntry, imageDataUrl?: string): OgElement {
	const columnWidth = imageDataUrl ? OG_WIDTH - OG_PANEL_WIDTH - OG_SEAM_WIDTH : OG_WIDTH;
	const padding = imageDataUrl ? OG_PADDING_SPLIT : OG_PADDING_FULL;

	return (
		<div
			style={{
				backgroundColor: colors.carbon,
				display: 'flex',
				height: OG_HEIGHT,
				width: OG_WIDTH,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding,
					width: columnWidth,
				}}
			>
				<div
					style={{
						backgroundColor: colors.accent,
						borderRadius: 2,
						display: 'flex',
						height: 8,
						width: 120,
					}}
				/>
				<div
					style={{
						color: colors.surface,
						display: 'flex',
						fontFamily: 'Aleo',
						fontSize: titleFontSize(entry.title.length, columnWidth),
						fontWeight: 600,
						letterSpacing: '-0.01em',
						lineClamp: 4,
						lineHeight: 1.15,
					}}
				>
					{entry.title}
				</div>
				<div
					style={{
						display: 'flex',
						fontFamily: 'Geist Mono',
						fontSize: 22,
						fontWeight: 500,
						letterSpacing: '2px',
					}}
				>
					<span style={{ color: colors.accentBright }}>{entry.label}</span>
					<span style={{ color: colors.muted, padding: '0 12px' }}>·</span>
					<span style={{ color: colors.muted }}>SYNAPTICISM</span>
				</div>
			</div>
			{imageDataUrl ? (
				<>
					<div
						style={{
							backgroundColor: colors.accent,
							display: 'flex',
							height: OG_HEIGHT,
							width: OG_SEAM_WIDTH,
						}}
					/>
					<img height={OG_HEIGHT} src={imageDataUrl} width={OG_PANEL_WIDTH} />
				</>
			) : undefined}
		</div>
	);
}

// Scale the title down as it lengthens so short titles stay punchy and long ones still fit
// Thresholds ride the measure: the split layout gives the text far less room
function titleFontSize(length: number, columnWidth: number): number {
	const scale = columnWidth / OG_WIDTH;

	if (length <= 32 * scale) return 72;
	if (length <= 64 * scale) return 60;
	if (length <= 96 * scale) return 48;
	return 40;
}
