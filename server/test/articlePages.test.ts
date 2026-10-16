import { afterEach, describe, expect, it } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { articlePages } from '../src/pages/articlePages.js'

// Longer than Fastify's default maxParamLength of 100, like an imported duos.blog slug.
const LONG_SLUG = 'where-is-all-the-nih-data-a-landscape-analysis-of-the-150-nih-repositories-and-the-path-beyond-the-mountains'

describe('articlePages', () => {
  let app: FastifyInstance
  let root: string

  const start = async (files: Record<string, string>) => {
    root = mkdtempSync(path.join(tmpdir(), 'build-'))
    for (const [file, html] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
      writeFileSync(path.join(root, file), html)
    }
    app = Fastify()
    // In production the app's not-found handler serves index.html.
    app.setNotFoundHandler((_request, reply) => reply.send('app'))
    await app.register(articlePages, { root })
  }

  afterEach(async () => {
    await app.close()
    rmSync(root, { recursive: true, force: true })
  })

  it('serves each article\'s prebuilt page at its URL, however long the slug', async () => {
    await start({
      'articles/user-guides/dac-guide.html': '<title>DAC Guide | DUOS</title>',
      [`articles/blog-posts/${LONG_SLUG}.html`]: '<title>NIH data | DUOS</title>',
      'articles/user-guides/notes.txt': 'not a page',
    })

    const guide = await app.inject({ method: 'GET', url: '/articles/user-guides/dac-guide' })
    expect(guide.statusCode).toBe(200)
    expect(guide.headers['content-type']).toBe('text/html; charset=utf-8')
    expect(guide.body).toBe('<title>DAC Guide | DUOS</title>')
    expect((await app.inject({ method: 'GET', url: `/articles/blog-posts/${LONG_SLUG}` })).body).toBe('<title>NIH data | DUOS</title>')
    expect((await app.inject({ method: 'GET', url: '/articles/user-guides/notes' })).body).toBe('app')
    expect((await app.inject({ method: 'GET', url: '/articles/user-guides/new-guide' })).body).toBe('app')
  })

  it('leaves everything to the app when the build has no article pages', async () => {
    await start({})

    expect((await app.inject({ method: 'GET', url: '/articles/user-guides/dac-guide' })).body).toBe('app')
  })
})
