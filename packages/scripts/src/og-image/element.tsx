import { Bitmap } from 'takumi-js/helpers/jsx';

import type { OgImageEntry } from './content.js';
import type { ProcessedImage } from './generate.js';

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
	surface: '#f4f4f5', // primary-100, the reading surface
} as const;

export function getOgElement(entry: OgImageEntry, image?: ProcessedImage) {
	const columnWidth = image ? OG_WIDTH - OG_PANEL_WIDTH - OG_SEAM_WIDTH : OG_WIDTH;
	const padding = image ? OG_PADDING_SPLIT : OG_PADDING_FULL;

	return (
		<div
			style={{
				backgroundColor: colors.carbon,
				display: 'flex',
				height: px(OG_HEIGHT),
				width: px(OG_WIDTH),
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: px(padding),
					width: px(columnWidth),
				}}
			>
				<div style={{ alignItems: 'center', display: 'flex' }}>
					<div
						style={{
							backgroundColor: colors.accent,
							borderRadius: '2px',
							display: 'flex',
							height: '4px',
							width: '56px',
						}}
					/>
					<span
						style={{
							color: colors.accentBright,
							fontFamily: 'Geist Mono',
							fontSize: '22px',
							fontWeight: 500,
							letterSpacing: '2px',
							marginLeft: '20px',
						}}
					>
						{entry.label.toUpperCase()}
					</span>
				</div>
				<div
					style={{
						color: colors.surface,
						fontFamily: 'Aleo',
						fontSize: px(titleFontSize(entry.title.length, columnWidth)),
						fontWeight: 600,
						letterSpacing: '-0.01em',
						lineClamp: 4,
						lineHeight: 1.15,
					}}
				>
					{entry.title}
				</div>
				{/* Mirrors the site header's brand mark: Aleo, semibold, uppercase, tracking-widest */}
				<div
					style={{
						color: colors.surface,
						display: 'flex',
						fontFamily: 'Aleo',
						fontSize: '22px',
						fontWeight: 600,
						letterSpacing: '0.1em',
					}}
				>
					SYNAPTICISM
				</div>
			</div>
			{image ? (
				<>
					<div
						style={{
							backgroundColor: colors.accent,
							display: 'flex',
							height: px(OG_HEIGHT),
							width: px(OG_SEAM_WIDTH),
						}}
					/>
					<Bitmap data={image.data} height={image.height} width={image.width} />
				</>
			) : undefined}
		</div>
	);
}

function px(value: number): string {
	return `${String(value)}px`;
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
