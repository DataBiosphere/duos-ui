// Converts the duos-ui import (articles.ts + Markdown bodies) into Docusaurus content
// at the exact duos.blog legacy paths. Usage: node convert.mjs <import dir> <site dir>
import fs from 'node:fs'
import path from 'node:path'

const [importDir, siteDir] = process.argv.slice(2)
const articlesDir = path.join(importDir, 'src/content/articles')

const CATEGORIES = {
  BLOG_POST: { dir: 'blog-posts', tag: 'Blog posts' },
  FEATURE_ANNOUNCEMENT: { dir: 'feature-announcements', tag: 'Feature announcements' },
  IN_THE_NEWS: { dir: 'in-the-news', tag: 'In the news' },
  POLICY_BRIEF: { dir: 'policy-briefs', tag: 'Policy briefs' },
  USER_GUIDE: { dir: 'user-guides', tag: 'User guides' },
  PAGE: { dir: 'pages', tag: 'Pages' },
}
// Duplicate of the Progress Reports user guide (DT-4234 comment 117172).
const DROPPED = { '/feature-announcements/progressreports/': '/2025/08/05/duos-progress-reports-user-guide/' }

const source = fs
  .readFileSync(path.join(articlesDir, 'articles.ts'), 'utf8')
  .replace(/^import .*$/m, '')
  .replace('export const ARTICLES: readonly Article[] =', 'return')
const articles = new Function(source)()

const legacyPath = (a) => new URL(a.legacyUrl).pathname
const byAppPath = new Map(articles.map((a) => [`/articles/${CATEGORIES[a.category].dir}/${a.slug}`, legacyPath(a)]))
const yaml = (fields) =>
  ['---', ...Object.entries(fields).map(([k, v]) => `${k}: ${JSON.stringify(v)}`), '---', ''].join('\n')

fs.rmSync(path.join(siteDir, 'blog'), { recursive: true, force: true })
fs.rmSync(path.join(siteDir, 'src/pages'), { recursive: true, force: true })
fs.mkdirSync(path.join(siteDir, 'blog'), { recursive: true })

const written = []
for (const a of articles) {
  const legacy = legacyPath(a)
  if (DROPPED[legacy]) continue
  let body = fs.readFileSync(path.join(articlesDir, CATEGORIES[a.category].dir, `${a.slug}.md`), 'utf8')
  body = body.replace(/\]\((\/articles\/[^)\s]+)\)/g, (m, p) => (byAppPath.has(p) ? `](${byAppPath.get(p)})` : m))

  const dated = legacy.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/[^/]+\/$/)
  let file
  if (dated) {
    file = path.join(siteDir, 'blog', `${a.publishDate}-${a.slug}.md`)
    const fm = { title: a.title, slug: legacy.replace(/\/$/, ''), date: a.publishDate, description: a.excerpt, tags: [CATEGORIES[a.category].tag] }
    fs.writeFileSync(file, yaml(fm) + body)
  } else {
    file = path.join(siteDir, 'src/pages', legacy, 'index.md')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, yaml({ title: a.title, description: a.excerpt }) + `# ${a.title}\n\n` + body)
  }
  written.push(legacy)
}

fs.writeFileSync(
  path.join(siteDir, 'legacy-paths.json'),
  JSON.stringify({ all: articles.map(legacyPath), written, redirects: DROPPED }, null, 2),
)
console.log(`${articles.length} articles: ${written.length} written, ${Object.keys(DROPPED).length} redirected`)
