# AGENTS.md

Source for [**synapticism.com**](https://synapticism.com): a dev blog, tech notebook, and creative coding project. An Astro site in a pnpm workspace: the root is the app (`src/`), and `packages/*` hold the content archive, the creative coding lab, build scripts, and other such things.

Vocabulary is fixed. Read [`.claude/context.md`](.claude/context.md) before naming things in code or in prose.

Do not add anything to this file unless it is important and relevant.

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

- Tailwind v4 provides the base and should be used when prototyping anything new but we prefer to avoid the more arcane and convoluted syntax where possible. If an atomic class isn't already in the main CSS output consider writing vanilla CSS.
- Utilities inline by default; a rule in `src/styles/main/components/<component>.css` (registered in `main.css` under `layer(components)`) only when the selector or value cannot sit on the element: content not authored here (MDX, pagefind, maplibre), structural and state selectors, pseudo-elements carrying `content`, values with no theme step.
- A decoration applied like a utility typically becomes a `@utility` in `parts/utilities.css`.
- No `<style>` blocks (they bundle into the same file, sit outside the cascade layers, and stop at the component's own template); `main-stylesheet.astro` is the one `is:inline` exception (FOUC guard).
- A hook class carries only what the stylesheet targets and shares a descriptive prefix or short-form representing the target. Avoid Microformat prefixes (`p-`, `h-`, `u-`, `dt-`, `e-`).
- Stylesheets read tokens as `var(--…)`; `@apply` where it replaces a media query or composes a project `@utility`.
- Stacking order is `--z-index-*` applied as `z-*` utilities or `var()`.
- `main.css` scans `components/`, `layouts/` and `pages/` only. A directory left off that list gets no utilities and cannot reach the production stylesheet, which is what keeps `src/design-system` (the dev-only `/design-system` page) out of a build.
- Every `hover:` on a focusable element has its `focus-visible:` twin where relevant. A stylesheet `:hover` sits under `@media (hover: hover)`, as Tailwind's `hover:` does; its `:focus-visible` partner stays outside it.
