import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'

interface ArticlePagesOptions {
  /** The built client: build/ in production. */
  readonly root: string
}

const readPages = async (articlesDir: string): Promise<{ url: string, html: string }[]> => {
  const entries = await readdir(articlesDir, { recursive: true, withFileTypes: true }).catch(() => [])
  const files = entries.filter(entry => entry.isFile() && entry.name.endsWith('.html'))
  return Promise.all(files.map(async (file) => {
    const category = path.relative(articlesDir, file.parentPath)
    return {
      url: `/articles/${category}/${file.name.slice(0, -'.html'.length)}`,
      html: await readFile(path.join(file.parentPath, file.name), 'utf8'),
    }
  }))
}

/**
 * Serves each article's prebuilt page (scripts/prerender-articles.tsx), so search engines and link
 * previews get its content. @fastify/vite serves build/ files only at their exact paths, so each
 * page gets its own route at /articles/<category>/<slug>; any other path falls through to the app.
 */
export async function articlePages(app: FastifyInstance, { root }: ArticlePagesOptions): Promise<void> {
  const pages = await readPages(path.join(root, 'articles'))
  for (const { url, html } of pages) {
    app.get(url, (_request, reply) => reply.type('text/html; charset=utf-8').send(html))
  }
}
