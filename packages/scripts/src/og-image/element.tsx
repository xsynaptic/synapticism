import type { CSSProperties } from 'react';

import {
	openGraphImageHeight,
	openGraphImageWidth,
	siteTitle,
} from '@synapticism/shared/constants';
import { Bitmap } from 'takumi-js/helpers/jsx';

import type { ProcessedImage } from './generate.js';
import type { OpenGraphEntryItem } from './types.js';

import {
	openGraphPaddingFull,
	openGraphPaddingSplit,
	openGraphPanelWidth,
	openGraphSeamWidth,
} from './constants.js';

// Mirrors src/styles/main/theme.css; scale positions given so they trace back to the site
const colors = {
	accent: '#2b7e8f', // accent-600
	accentBright: '#4cb6c4', // accent-400, readable on carbon
	carbon: '#27272a', // primary-800, the site background
	surface: '#f4f4f5', // primary-100, the reading surface
} as const;

const styles = {
	accentBar: {
		backgroundColor: colors.accent,
		borderRadius: '2px',
		display: 'flex',
		height: '4px',
		width: '56px',
	},
	canvas: {
		backgroundColor: colors.carbon,
		display: 'flex',
		height: px(openGraphImageHeight),
		width: px(openGraphImageWidth),
	},
	column: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	header: { alignItems: 'center', display: 'flex' },
	label: {
		color: colors.accentBright,
		fontFamily: 'Geist Mono',
		fontSize: '22px',
		fontWeight: 500,
		letterSpacing: '2px',
		marginLeft: '20px',
	},
	seam: {
		backgroundColor: colors.accent,
		display: 'flex',
		height: px(openGraphImageHeight),
		width: px(openGraphSeamWidth),
	},
	siteTitle: {
		color: colors.surface,
		display: 'flex',
		fontFamily: 'Aleo',
		fontSize: '22px',
		fontWeight: 600,
		letterSpacing: '0.1em',
	},
	title: {
		color: colors.surface,
		fontFamily: 'Aleo',
		fontWeight: 600,
		letterSpacing: '-0.01em',
		lineClamp: 4,
		lineHeight: 1.15,
		textOverflow: 'ellipsis',
	},
} satisfies Record<string, CSSProperties>;

export function getOpenGraphElement(entry: OpenGraphEntryItem, image?: ProcessedImage) {
	const columnWidth = image
		? openGraphImageWidth - openGraphPanelWidth - openGraphSeamWidth
		: openGraphImageWidth;
	const padding = image ? openGraphPaddingSplit : openGraphPaddingFull;

	return (
		<div style={styles.canvas}>
			<div style={{ ...styles.column, padding: px(padding), width: px(columnWidth) }}>
				<div style={styles.header}>
					<div style={styles.accentBar} />
					{entry.label ? <span style={styles.label}>{entry.label.toUpperCase()}</span> : undefined}
				</div>
				<div
					style={{
						...styles.title,
						fontSize: px(titleFontSize(entry.title.length, columnWidth)),
					}}
				>
					{entry.title}
				</div>
				<div style={styles.siteTitle}>{siteTitle.toUpperCase()}</div>
			</div>
			{image ? (
				<>
					<div style={styles.seam} />
					<Bitmap data={image.data} height={image.height} width={image.width} />
				</>
			) : undefined}
		</div>
	);
}

function px(value: number): string {
	return `${String(value)}px`;
}

// Thresholds ride the measure: the split layout gives the text far less room
function titleFontSize(length: number, columnWidth: number): number {
	const scale = columnWidth / openGraphImageWidth;

	if (length <= 32 * scale) return 72;
	if (length <= 64 * scale) return 60;
	if (length <= 96 * scale) return 48;
	return 40;
}
