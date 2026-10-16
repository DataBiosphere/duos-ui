# DUOS Articles

Ticket: [DT-4234](https://broadworkbench.atlassian.net/browse/DT-4234)

Move the blog posts, user guides, announcements and help pages from duos.blog (hosted on WordPress) into DUOS as public `/articles` pages.

## Decisions

| Question | Decision |
| --- | --- |
| Storage and publishing | Content lives in duos-ui and is published by PR and the daily release, following the [Data Showcase plan](https://github.com/DataBiosphere/consent/blob/develop/docs/plans/data-showcase-delivery-plan.md) (product decision, 2026-10-15). There is no database, consent API or admin editor. |
| Metadata | One typed list, `src/content/articles/articles.ts`, holds every article's metadata, the way `libraryVersions.ts` holds the featured data libraries. The type checker validates each entry. |
| Bodies | `src/content/articles/<category path>/<slug>.md`, Markdown without a header, loaded on demand as an asset like `src/assets/DPA.md`. |
| URLs | `/articles/<category path>/<slug>`. Slugs are unique within a category. |
| Categories | Blog posts, user guides, feature announcements, in the news, policy briefs, pages |
| Visibility | Drafts and articles whose `publishDate` is in the future are left out of listings and their pages show not found. `publishDate` is a UTC date, so an article appears at midnight UTC; its static page and sitemap entry follow at the next release. A draft is unlisted, not private: every body ships as a build asset, so content that must stay confidential stays off `develop`. |
| Rendering | `react-markdown` with `remark-gfm` for tables and strikethrough. Raw HTML is never rendered, and unsafe URLs such as `javascript:` are dropped. Internal links stay in the app; external links open in a new tab. |
| Images | Stored in `public/article-images/` and linked by absolute path (`/article-images/...`), because Vite copies a Markdown asset as-is and wouldn't emit images it references. The import copies in the duos.blog images, which hot-link Google Docs export URLs that tend to expire. |
| Study and datasets | Shown as cards whose details come from the Showcase public lookup, so private datasets stay hidden. |
| Search indexing | The build writes a static HTML page per article (title, description, link-preview tags, body) plus `sitemap.xml`. Readers still get the app. |

## Article metadata

| Field | Required | Notes |
| --- | --- | --- |
| `category` | yes | Also the body's folder |
| `slug` | yes | Lowercase words joined by hyphens; also the body's file name |
| `title` | yes | |
| `excerpt` | yes | Card text and page description |
| `publishDate` | yes | `YYYY-MM-DD`; hidden until then |
| `tags` | no | |
| `featured` | no | Featured articles list first |
| `author` | no | Byline |
| `parent` | no | Slug of the page this one sits under, for breadcrumbs, e.g. `help` |
| `legacyUrl` | no | The duos.blog URL the article replaces, for redirects |
| `draft` | no | Hidden while true |

`test/content/articles.spec.ts` fails CI when an entry is invalid, is listed twice, has no body file, names a `parent` that isn't a page, or reuses another article's `legacyUrl`, and when a body file isn't listed.

## Adding an article

1. Write the body as `src/content/articles/<category path>/<slug>.md`, with any images in `public/article-images/`.
2. Add its entry to `src/content/articles/articles.ts`.
3. Open a PR. The article is live after the next release on or after its `publishDate`.

## Work

Each PR stays under 500 lines of code and tests.

1. **Article format:** this plan, the metadata type and list, the body loader, the validation spec, and the Markdown renderer.
2. **Public pages:** `/articles` (all articles and per-category tabs, with tag filter and pagination) and `/articles/<category>/<slug>` (breadcrumb, byline, body, not-found page). Article pages load on demand.
3. **duos.blog import:** a checked-in script turns the 25 posts and 13 pages into Markdown and copies the images. The output is reviewed as a normal diff.
4. **Search indexing:** a static page per article plus `sitemap.xml`. It starts by checking that the BFF and the non-BFF deploy serve those pages before falling back to the app. If they don't, the fallback is per-article meta tags injected by the BFF.
5. **Study and dataset cards,** once DT-4274, DT-4275 and DT-4281 are done.
6. **Switch the links:** the 10 hardcoded `duos.blog` links and the logged-out "Blog" tab point to `/articles`, and their specs are updated. duos.blog then redirects or is retired.

The renderer, URL helpers and public pages come from the UI-only branch `lawson-dt-4234-duos-native-blog`.

## Open items

- Where `help/preauthorize_researchers_librarycards` points: it isn't among the 13 pages. The import resolves it.
- Whether duos.blog stays up as a redirect site or is retired.
- Who writes posts after the move, now that it needs a PR.
