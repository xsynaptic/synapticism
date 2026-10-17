# Station tile

Generative mosaic tile walls in the style of Hong Kong MTR stations, painted as an SVG background image. The same input and seed always give the same wall.

## Pipeline

Everything under `core/` is pure and runs the same at build time and in the browser:

1. `resolveOptions` (`options.ts`) fills a `TileInput` from `TILE_DEFAULTS`, takes the colour pair from `theme` unless `colorA` / `colorB` override it, hashes `seed` into a root seed, and sizes the canvas: 768 wide at the given aspect ratio, or a repeat unit of whole cells when `seamless`
2. `layoutTiles` (`layout.ts`) places the cells. Each cell draws from its own stream, `cellSeed(rootSeed, col, row)`, so a cell keeps its colour when the grid grows. In seamless mode every cell that overhangs the repeat unit gets a twin on the opposite edge
3. `generateTileSvg` (`render.ts`) writes the SVG: grout, one `<use>` per tile body, then gloss and grain as `feTurbulence` filters, each skipped at zero strength
4. `tileBackgroundStyle` (`render.ts`) turns the SVG into a data URI and returns the background properties: `cover` for a canvas, `repeat` at the unit's size for a seamless one

## Consumers

- `station-tile.astro` runs the pipeline at build time and ships no JavaScript; the tile is an inline style on a `div`
- `<station-tile>` (`client/station-tile.ts`) runs it in the browser whenever its `options` property is set. The Lab on `station-tile-lab.mdx` (`station-tile-lab.astro`, `client/station-tile-lab.ts`) drives one from a form

`tileBackgroundStyle` is shared, so both paint identically.

## No dependencies

The core imports nothing outside itself. Its PRNG (`random.ts`) and colour maths (`color.ts`) are a few dozen lines each, and they ship in the Lab's client bundle. `@thi.ng/random` and `@thi.ng/color` sit in this package's dependencies for `glitch-graph`, not for this.

## Tests

`core/*.test.ts`, run by the root `pnpm test`: same seed, same SVG; a cell keeps its colour as the grid grows; seamless wrap twins every overhanging cell; a staggered repeat unit has an even row count; hex parsing rejects invalid input.
