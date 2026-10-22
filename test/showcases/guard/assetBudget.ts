/**
 * CI guard rule: the asset budget for one showcase (DT-4273, S1.2).
 *
 * PLACEHOLDER VALUES. S1.3 (DT-4276) sets the real per-showcase budget and may change every number
 * here. The logo limits are the hard limits in `DATA-LIBRARY.md`.
 */
import { statSync } from 'node:fs'
import { resolve } from 'node:path'

const KB = 1024

export const ASSET_BUDGET = {
  /** All distinct images that one config references, together. */
  totalBytes: 1024 * KB,
  /** Each image that is not a logo, such as a thumbnail or an icon. */
  imageBytes: 300 * KB,
  /** Each masthead logo, by format. Logos must be SVG or PNG. */
  logoBytes: { svg: 100 * KB, png: 150 * KB },
} as const

/** Returns an image's size in bytes, or `undefined` when the file does not exist. */
export type ReadSize = (src: string) => number | undefined

/** Config image `src` values are paths below `src/images`. Vitest runs from the repository root. */
export const readImageSize: ReadSize = (src) => {
  const stats = statSync(resolve('src/images', src), { throwIfNoEntry: false })
  return stats?.isFile() ? stats.size : undefined
}

interface ImageRef { path: string, src: string }

const isImage = (value: object): value is { src: string, alt: string } =>
  'src' in value && 'alt' in value && typeof value.src === 'string'

/** Every image in the config, enabled or not: a disabled section's images still ship. */
const collectImages = (value: unknown, path: string, found: ImageRef[] = []): ImageRef[] => {
  if (value === null || typeof value !== 'object') {
    return found
  }
  if (isImage(value)) {
    found.push({ path, src: value.src })
    return found
  }
  Object.entries(value).forEach(([key, child]) => collectImages(child, path ? `${path}.${key}` : key, found))
  return found
}

const logoLimit = (src: string): number | undefined => {
  const extension = src.split('.').pop()?.toLowerCase()
  return extension === 'svg' || extension === 'png' ? ASSET_BUDGET.logoBytes[extension] : undefined
}

const checkImage = ({ path, src }: ImageRef, size: number): string | undefined => {
  const isLogo = path.startsWith('sections.masthead.logos.')
  const limit = isLogo ? logoLimit(src) : ASSET_BUDGET.imageBytes
  if (limit === undefined) {
    return `${path}: logo "${src}" must be SVG or PNG`
  }
  return size > limit ? `${path}: "${src}" is ${size} bytes; the limit is ${limit}` : undefined
}

/** Returns one message for each broken rule; an empty list means the config is within budget. */
export const checkAssetBudget = (config: unknown, readSize: ReadSize = readImageSize): string[] => {
  const errors: string[] = []
  const distinct = new Map<string, number>()
  collectImages(config, '').forEach((image) => {
    const size = readSize(image.src)
    if (size === undefined) {
      errors.push(`${image.path}: "${image.src}" not found below src/images`)
      return
    }
    distinct.set(image.src, size)
    const error = checkImage(image, size)
    if (error) {
      errors.push(error)
    }
  })
  const total = [...distinct.values()].reduce((sum, size) => sum + size, 0)
  if (total > ASSET_BUDGET.totalBytes) {
    errors.push(`images total ${total} bytes; the limit is ${ASSET_BUDGET.totalBytes}`)
  }
  return errors
}
