import { useEffect } from 'react'
import { Article } from 'src/types/article'
import { ARTICLE_META_ATTRIBUTE, articleHeadTags } from 'src/utils/articleMeta'

/**
 * Keeps the article's head tags in place while its page shows and removes them on leaving. On a
 * prebuilt page it first clears the prebuilt tags and title, so the next page doesn't inherit them;
 * call it before usePageTitle, which restores whatever title it found.
 */
export const useArticleMeta = (article: Article | undefined) => {
  useEffect(() => {
    const prebuilt = document.head.querySelectorAll(`[${ARTICLE_META_ATTRIBUTE}]`)
    if (prebuilt.length > 0) {
      prebuilt.forEach(element => element.remove())
      document.title = 'DUOS'
    }
    if (article === undefined) {
      return
    }
    const elements = articleHeadTags(article).map(({ tag, attributes }) => {
      const element = document.createElement(tag)
      Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
      element.setAttribute(ARTICLE_META_ATTRIBUTE, '')
      return element
    })
    document.head.append(...elements)
    return () => elements.forEach(element => element.remove())
  }, [article])
}
