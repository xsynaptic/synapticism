import type { OpenGraphCardInput } from '@synapticism/shared/open-graph';
import type { CSSProperties } from 'react';

import {
	openGraphImageHeight,
	openGraphImageWidth,
	siteTitle,
} from '@synapticism/shared/constants';
import { Bitmap } from 'takumi-js/helpers/jsx';

import type { ProcessedImage } from '#og-image/generate.ts';

import {
	openGraphBandHeight,
	openGraphMastheadHeight,
	openGraphPaddingX,
	openGraphPaddingY,
} from '#og-image/constants.ts';

// Mirrors src/styles/main/parts/theme.css and the site header; scale positions trace back to the site
const colors = {
	primary50: '#f9fafb',
	primary100: '#f3f4f6',
	primary200: '#e2e5e9',
	primary600: '#4d5360',
	primary700: '#3a404b',
	primary800: '#23272f',
	primary900: '#15181f',
	white: '#ffffff',
} as const;

const styles = {
	band: {
		display: 'flex',
		flexDirection: 'column',
		height: px(openGraphBandHeight),
		position: 'relative',
	},
	bandLayer: {
		display: 'flex',
		inset: 0,
		position: 'absolute',
	},
	bandScrim: {
		backgroundImage: `linear-gradient(to bottom, rgba(21, 24, 31, 0.85), rgba(21, 24, 31, 0.15) 60%)`,
	},
	body: {
		backgroundImage: `linear-gradient(to bottom, ${colors.white}, ${colors.primary100} 55%, ${colors.primary200})`,
		display: 'flex',
		flexDirection: 'column',
		flexGrow: 1,
		justifyContent: 'flex-end',
		padding: `0 ${px(openGraphPaddingX)} ${px(openGraphPaddingY)}`,
	},
	canvas: {
		display: 'flex',
		flexDirection: 'column',
		height: px(openGraphImageHeight),
		width: px(openGraphImageWidth),
	},
	description: {
		color: colors.primary600,
		fontFamily: 'Red Hat Text',
		fontSize: '34px',
		lineClamp: 2,
		lineHeight: 1.35,
		marginTop: '28px',
		textOverflow: 'ellipsis',
	},
	masthead: {
		alignItems: 'center',
		color: colors.primary50,
		display: 'flex',
		fontFamily: 'Aleo',
		fontSize: '34px',
		fontWeight: 600,
		height: px(openGraphMastheadHeight),
		letterSpacing: '0.1em',
		padding: `0 ${px(openGraphPaddingX)}`,
		position: 'relative',
	},
	mastheadGround: {
		backgroundImage: `linear-gradient(to bottom, ${colors.primary800}, ${colors.primary700})`,
	},
	title: {
		color: colors.primary900,
		fontFamily: 'Aleo',
		fontWeight: 500,
		lineHeight: 1.08,
		textOverflow: 'ellipsis',
		textWrap: 'balance',
	},
} satisfies Record<string, CSSProperties>;

export function getOpenGraphElement(entry: OpenGraphCardInput, image?: ProcessedImage) {
	const masthead = <div style={styles.masthead}>{siteTitle.toUpperCase()}</div>;

	return (
		<div style={styles.canvas}>
			{image ? (
				<div style={styles.band}>
					<div style={styles.bandLayer}>
						<Bitmap data={image.data} height={image.height} width={image.width} />
					</div>
					<div style={{ ...styles.bandLayer, ...styles.bandScrim }} />
					{masthead}
				</div>
			) : (
				<div style={{ ...styles.mastheadGround, display: 'flex', flexDirection: 'column' }}>
					{masthead}
				</div>
			)}
			<div style={styles.body}>
				<div
					style={{
						...styles.title,
						fontSize: px(titleFontSize(entry.title.length, image !== undefined)),
						lineClamp: image ? 2 : 3,
					}}
				>
					{entry.title}
				</div>
				{entry.description ? <div style={styles.description}>{entry.description}</div> : undefined}
			</div>
		</div>
	);
}

function px(value: number): string {
	return `${String(value)}px`;
}

function titleFontSize(length: number, hasImage: boolean): number {
	if (!hasImage && length <= 16) return 104;
	if (length <= 32) return 88;
	if (length <= 56) return 72;
	return 60;
}
