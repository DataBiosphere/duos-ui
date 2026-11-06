/**
 * Showcase image paths (DT-4354, S3.2). A config names an image by its path below `src/images`,
 * and showcase images live in `src/images/showcase/<key>/` (delivery plan section 3). This module
 * bundles that directory and turns a config path into the bundled URL. A path outside it, or one
 * that names no file, resolves to nothing, so the renderer shows the alt text instead.
 */
import { isSafeImageSrc } from 'src/components/showcase/primitives/safeHref'

const PREFIX = '../images/'

/** The extensions the glob below bundles; keep the two lists the same. */
export const SHOWCASE_IMAGE_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'] as const

/**
 * True for a config image path that this module can resolve: below `showcase/`, with no `..`
 * segment, and with an extension the glob bundles. The CI guard applies the same test, so a config
 * can't name an image that the page would show as alt text.
 */
export const isShowcaseImagePath = (src: string): boolean => {
  const segments = src.split('/')
  const extension = src.split('.').pop() ?? ''
  return segments[0] === 'showcase'
    && segments.length > 2
    && !segments.some(segment => segment === '' || segment === '.' || segment === '..')
    && (SHOWCASE_IMAGE_EXTENSIONS as readonly string[]).includes(extension)
}

/** Vite emits each file and maps its module path to the served URL. */
const BUNDLED: Readonly<Record<string, string>> = import.meta.glob<string>('../images/showcase/**/*.{svg,png,jpg,jpeg,webp,gif,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** The bundled URL for a config image path, or undefined. */
export const resolveShowcaseImage = (src: string): string | undefined => {
  const key = `${PREFIX}${src}`
  const url = Object.hasOwn(BUNDLED, key) ? BUNDLED[key] : undefined
  return url !== undefined && isSafeImageSrc(url) ? url : undefined
}
