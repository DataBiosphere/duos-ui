import { useEffect, useState } from 'react'
import { Blog } from 'src/libs/ajax/Blog'

export type BlogImageResolver = (imageId: string) => string | undefined

const UNRESOLVED: BlogImageResolver = () => undefined

/**
 * Resolves uploaded blog image ids to URLs. Markdown renderers cannot await, so the resolver is
 * loaded once and images render as soon as it arrives.
 */
export const useBlogImageResolver = (): BlogImageResolver => {
  const [resolver, setResolver] = useState<BlogImageResolver>(() => UNRESOLVED)

  useEffect(() => {
    let active = true
    Blog.getImageUrlResolver()
      .then((loaded) => {
        if (active) {
          setResolver(() => loaded)
        }
      })
      // Images just stay blank — the surrounding page still renders.
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  return resolver
}
