# AGENTS.md

Source for [synapticism.com](https://synapticism.com), a professional portfolio and web development blog. An Astro site in a pnpm workspace: the root is the app (`src/`), and `packages/*` hold the content archive, the creative-coding lab, a sitemap integration wrapper, and build scripts.

## Commands

Scripts live in `package.json`. Only the ones with a catch are worth stating here:

- `pnpm check`: report-only quality gate (stylelint, prettier, eslint, `astro check`, tsc, knip). Mutates nothing.
- `pnpm fix`: the mutating twin of `pnpm check`. Run once after a chunk of work, not repeatedly.
- **Neither one touches MDX.** Content linting is separate: `pnpm check-content` and `pnpm fix-content` (mdxlint over `packages/content`).
- `pnpm build` is a pipeline, not a synonym for `astro build`: it regenerates LQIP placeholders (incrementally cached in `.cache/media-lqip.json`), then runs `astro check`, the build, and OG image generation. Calling `astro build` directly skips all three.

## Conventions

- Dynamic route files must use lowercase (e.g., `[...id].astro` not `[...ID].astro`)
- Use new lines after declarations to improve code readability
- Check `./src/lib` for existing utilities before creating new ones
- Use path aliases `#` to reference `src/` folder (e.g., `#lib/` means `src/lib/`)

## Styling

- Use Tailwind CSS v4 for all styling
- Use scoped styles in .astro files only when necessary
- Place global styles in `src/styles/main.css`
- Layout components use computed `props` for dynamic CSS classes
