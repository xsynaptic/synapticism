import type { TileTheme } from '#station-tile/core/appearance.ts';
import type { TileInput } from '#station-tile/core/options.ts';

export interface StationTileLabProps {
	class?: string | undefined;
	// Canonical URL where the lab runs; feeds and listings link here instead of rendering it
	href?: string | undefined;
	seed?: number | string | undefined;
	theme?: TileTheme | undefined;
}

export interface StationTileProps extends TileInput {
	class?: string | undefined;
}
