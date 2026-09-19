import type { TileTheme } from '#station-tile/core/appearance.ts';
import type { TileInput } from '#station-tile/core/options.ts';

export interface StationTileLabProps {
	class?: string | undefined;
	// Canonical URL where the lab runs; used for the RSS link-to-live fallback
	href?: string | undefined;
	seed?: number | string | undefined;
	theme?: TileTheme | undefined;
}

export interface StationTileProps extends TileInput {
	class?: string | undefined;
}
