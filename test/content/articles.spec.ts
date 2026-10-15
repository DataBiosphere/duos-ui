import { describe, expect, it } from 'vitest'
import { ARTICLES } from 'src/content/articles/articles'
import { ARTICLE_BODY_URLS, validateArticles } from 'src/utils/ArticleUtils'

describe('articles', () => {
  it('match their body files and are all valid', () => {
    expect(validateArticles(ARTICLES, Object.keys(ARTICLE_BODY_URLS))).toEqual([])
  })
})
