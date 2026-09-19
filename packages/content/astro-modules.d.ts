// The MDX language server is Volar-based and ignores `@astrojs/ts-plugin`, so `.astro` imports need declaring here
declare module '*.astro' {
	const component: (props: Record<string, unknown>) => React.JSX.Element;

	export default component;
}

declare module '@synapticism/lab/glitch-graph/glitch-graph.astro' {
	import type { GlitchGraphProps } from '@synapticism/lab/glitch-graph/glitch-graph-types.ts';

	const component: (props: GlitchGraphProps) => React.JSX.Element;

	export default component;
}

declare module '@synapticism/lab/station-tile/station-tile.astro' {
	import type { StationTileProps } from '@synapticism/lab/station-tile/station-tile-types.ts';

	const component: (props: StationTileProps) => React.JSX.Element;

	export default component;
}

declare module '@synapticism/lab/station-tile/station-tile-lab.astro' {
	import type { StationTileLabProps } from '@synapticism/lab/station-tile/station-tile-types.ts';

	const component: (props: StationTileLabProps) => React.JSX.Element;

	export default component;
}
