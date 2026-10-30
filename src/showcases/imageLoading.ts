/**
 * The lazy-loading convention for showcase images (DT-4276, S1.3). Images in sections that render
 * above the fold load eagerly, so the first screen doesn't wait on a scroll; every other image
 * loads lazily, as the Home page's library logos already do. Renderers pass the result to the
 * `<img>` element's `loading` attribute instead of choosing per component.
 */
import type { SectionKey } from 'src/types/showcase'

/** The masthead logos are the only images on the first screen; the hero has none. */
export const EAGER_IMAGE_SECTIONS: readonly SectionKey[] = ['masthead']

export const imageLoading = (section: SectionKey): 'eager' | 'lazy' =>
  EAGER_IMAGE_SECTIONS.includes(section) ? 'eager' : 'lazy'
