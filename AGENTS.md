# AGENTS.md

Source for [**synapticism.com**](https://synapticism.com): a dev blog, tech notebook, and creative coding project.

Vocabulary is fixed. Read [`.claude/context.md`](.claude/context.md) before naming things in code or in prose.

Add a line here only when an agent cannot see it in the repo or work it out quickly.

## Commands

`package.json` holds the scripts. The ones with a catch:

- `pnpm check` reports, `pnpm fix` mutates. Run `fix` once after a chunk of work, not repeatedly.
- Neither touches MDX. Content linting is separate: `pnpm check-content` and `pnpm fix-content`.
- `pnpm build` is a pipeline. `astro build` on its own skips LQIP placeholders, `astro check`, sitemap lastmod, and OG image generation.
- `pnpm test-e2e-smoke` runs against `dist/`, so build first. It sits outside `check`; `deploy-site` runs it unless given `--skip-smoke`.

## Conventions

- Import from `src/` through the `#` alias, declared in `package.json` `imports` rather than `tsconfig.json`
- Leave a blank line after a declaration block

## Styling

- Tailwind v4 is the base; prototype with it. Where its syntax turns arcane, or the atomic class is not already in the CSS output, write vanilla CSS.
- Utilities inline by default. A rule in `src/styles/main/components/<component>.css` (registered in `main.css` under `layer(components)`) only when the selector or value cannot sit on the element: content not authored here (MDX, pagefind, maplibre), structural and state selectors, pseudo-elements carrying `content`, values with no theme step.
- A decoration applied like a utility becomes a `@utility` in `parts/utilities.css`.
- No `<style>` blocks; they sit outside the cascade layers. `main-stylesheet.astro` is the one `is:inline` exception, guarding against FOUC.
- A hook class carries only what the stylesheet targets, under a descriptive prefix naming that target. Microformat prefixes (`p-`, `h-`, `u-`, `dt-`, `e-`) stay out.
- Stylesheets read tokens as `var(--…)`; `@apply` where it replaces a media query or composes a project `@utility`.
- Stacking order is `--z-index-*`, applied as `z-*` utilities or `var()`.
- `main.css` scans `components/`, `layouts/` and `pages/` only. A directory left off that list gets no utilities and cannot reach the production stylesheet.
- Every `hover:` on a focusable element has its `focus-visible:` twin where relevant. A stylesheet `:hover` sits under `@media (hover: hover)`; its `:focus-visible` partner stays outside it.

## Content

`packages/content` is a separate private repository, nested here and gitignored whole, so `git clean -xdf` deletes it outright, its own `.git` included. Its rules are in `packages/content/AGENTS.md`.

- Adding a component to `autoImport()` in `astro.config.ts` means adding its props to `MDXProvidedComponents` in `packages/content/global.d.ts`; an mdast plugin injects the imports, so the MDX language server cannot see them.
- A lab `.astro` module imported from MDX needs declaring in `packages/content/astro-modules.d.ts`.
