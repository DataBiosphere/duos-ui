import { defaultUrlTransform } from 'react-markdown'
import { parseDuosImageId } from 'src/utils/BlogUtils'
import type { BlogImageResolver } from 'src/components/blog/useBlogImageResolver'

/**
 * `duos-image:` ids resolve to the image endpoint; every other URL gets react-markdown's default
 * treatment, which drops unsafe protocols such as `javascript:`.
 */
export const blogUrlTransform = (resolveImage: BlogImageResolver) => (url: string): string => {
  const imageId = parseDuosImageId(url)
  return imageId === undefined ? defaultUrlTransform(url) : resolveImage(imageId) ?? ''
}
