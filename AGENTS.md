# AGENTS.md

Source for [synapticism.com](https://synapticism.com), a professional portfolio and web development blog. An Astro site in a pnpm workspace: the root is the app (`src/`), and `packages/*` hold the content archive, the creative-coding lab, a sitemap integration wrapper, and build scripts.

## Conventions

- Dynamic route files must use lowercase (e.g., `[...id].astro` not `[...ID].astro`)
- Use new lines after declarations to improve code readability
- Check `./src/lib` for existing utilities before creating new ones
- Use path aliases `#` to reference `src/` folder (e.g., `#lib/` means `src/lib/`)

## Styling

- Use Tailwind CSS v4 for all styling
- Use scoped styles in .astro files only when necessary
- Place global styles in `src/styles/global.css`
- Layout components use computed `props` for dynamic CSS classes
