import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ARTICLES } from 'src/content/articles/articles'
import { ARTICLE_BODY_URLS, articleBodyFile, validateArticles } from 'src/utils/ArticleUtils'

describe('articles', () => {
  it('match their body files and are all valid', () => {
    expect(validateArticles(ARTICLES, Object.keys(ARTICLE_BODY_URLS))).toEqual([])
  })

  it('link only images that exist, and every image is linked', () => {
    const linked = new Set(ARTICLES.flatMap(article =>
      [...readFileSync(`.${articleBodyFile(article)}`, 'utf8').matchAll(/\/article-images\/([^)\s]+)/g)].map(match => match[1])))
    const files = existsSync('public/article-images')
      ? readdirSync('public/article-images', { withFileTypes: true }).filter(entry => entry.isFile()).map(entry => entry.name)
      : []

    expect([...linked].sort()).toEqual(files.sort())
  })
})
