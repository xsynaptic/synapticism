# Synapticism

This file is a glossary of terms commonly used in this project.

## Content

**Entry**: A single piece of authored content in a collection, sourced from one Markdown or MDX file. _Avoid_: document, record, node, item (reserve "item" for catalog rows).

**Collection**: A named set of Entries sharing one schema (Posts, Notes, Projects, Pages, Tags). _Avoid_: content type, model.

**Post**: A long-form article, the site's principal form of writing. _Avoid_: article, blog post, story.

**Note**: A short Entry: an observation or a piece of commentary that does not justify a full article. The distinction from a Post is length and ambition, not kind. _Avoid_: snippet, micropost, aside.

**Project**: Something designed, built, or worked on, published as its own Entry. Posts and Notes may reference a Project, which gathers them as its related writing. _Avoid_: work, case study, portfolio item.

**Page**: A standalone Entry outside the editorial stream (about, colophon). _Avoid_: static page.

**Tag**: A subject grouping that cuts across collections. Tags are flat and do not nest, and each is an Entry in its own right with a title and description. _Avoid_: topic, category, theme, keyword.

**Stream**: The interleaved reverse-chronological run of Posts and Notes that forms the homepage and its paginated continuation. _Avoid_: feed (RSS is the feed), timeline, blog, archive.

**Catalog**: The unified, cross-collection view of every Entry reduced to a common shape, used for listing, counting, sorting, and resolving references. _Avoid_: index, registry, manifest.

**Excerpt**: The opening portion of an Entry's body shown in the Stream, ending where the author places the fold. _Avoid_: teaser, preview, snippet, summary (a Description is the summary).

**Description**: A short summary of an Entry, either authored in frontmatter or derived by clipping the opening of the body. Appears in listings, social previews, and search results. _Avoid_: summary, blurb, abstract, excerpt.

**Entry Quality**: How complete and well-developed the writing on an Entry is, on a scale of 1 to 5. An editorial self-assessment of the text, not of its subject. _Avoid_: quality, score, rating.

## Reference and connection

**Link**: An internal cross-reference from one Entry to another, authored in body text. A Link names its target by identifier rather than by URL, so it survives a change of address. _Avoid_: wikilink, internal link, cross-link.

**Backlink**: An inbound Link, seen from the target: the set of Entries that point at this one. Only the `<Link id="...">` component produces Backlinks; ordinary Markdown links in the body do not. _Avoid_: reverse link, mention, inbound reference.

## Imagery

**Image**: A picture in the media library, addressed by its path within that library rather than by URL. _Avoid_: photo, asset, upload, file.

**Featured Image**: An Image attached to an Entry to represent it, in listings and in social previews. An Entry may carry several; the first is the most representative and is the one used wherever a single image is needed. _Avoid_: cover, thumbnail, OG image.

**Hero**: A Featured Image promoted to the header display at the top of an Entry's page. Promotion is opt-in per image, so an Entry with Featured Images may still have no Hero. _Avoid_: banner, splash, masthead.

## Beyond the content model

**Lab**: The body of self-contained creative-coding experiments kept outside the content model, each usable on the site and developed against its own set of interactive controls. _Avoid_: demos, sandbox, toys, playground.
