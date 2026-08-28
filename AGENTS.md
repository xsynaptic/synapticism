# AGENTS.md

Source for [synapticism.com](https://synapticism.com): a dev blog, tech notebook, and creative coding project. An Astro site in a pnpm workspace: the root is the app (`src/`), and `packages/*` hold the content archive, the creative coding lab, build scripts, and other such things.

Vocabulary is fixed. Read [`.claude/context.md`](.claude/context.md) before naming things in code or in prose.

## Commands

`package.json` holds the scripts. The ones with a catch:

- `pnpm check` reports, `pnpm fix` mutates. Run `fix` once after a chunk of work, not repeatedly.
- Neither touches MDX. Content linting is separate: `pnpm check-content` and `pnpm fix-content` (mdxlint over `packages/content`).
- `pnpm build` is a pipeline, not a synonym for `astro build`: LQIP placeholders (incrementally cached in `.cache/media-lqip.json`), then `astro check`, the build, and OG image generation (cards cached in `.cache/og`, copied into `dist/og`). Calling `astro build` directly skips all three.
- `pnpm deploy-site` ships `dist/` to Cloudflare Workers Static Assets per `wrangler.jsonc`. There is no Astro adapter; a prior `wrangler login` is required.

## Conventions

- Import from `src/` through the `#` alias, declared in `package.json` `imports` rather than `tsconfig.json` (e.g. `#lib/catalog/catalog-types.ts`)
- `src/lib` already holds `catalog`, `collections`, `i18n`, `schemas`, `utils`; look there before writing a utility
- Leave a blank line after a declaration block

## Styling

- Tailwind v4 carries the styling. Global CSS lives in `src/styles/main/*.css`, imported by `src/styles/main.css`; reach for a scoped `<style>` in an `.astro` file only when a rule cannot live there
- Compose dynamic classes with Astro's `class:list={[...]}`
