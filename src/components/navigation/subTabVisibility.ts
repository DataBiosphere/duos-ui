import { isFunction, isNil } from 'src/utils/NodashUtil'
import { DuosUser } from 'src/types/model'

export interface SubTab {
  label: string
  link: string
  search?: string
  isRendered?: (user: DuosUser) => boolean
  isRenderedForUser?: (user: DuosUser) => boolean
  /** Suppresses the sub-tab bar while this sub-tab is the selected one. */
  hideSubTabBar?: boolean
}

/**
 * The single source of truth for which sub-tabs a user can see.
 *
 * DuosHeader derives `initialSubTab` as an index into this filtered list, and the sub-tab bar
 * renders from it, so both must filter with the exact same predicate - otherwise the selected
 * index points at the wrong sub-tab as soon as any sub-tab is hidden.
 */
export const visibleSubTabs = (
  children: SubTab[] | undefined,
  currentUser: DuosUser,
): SubTab[] =>
  (children ?? []).filter((subTab) => {
    // Default to displaying the sub tab if no render function exists for it
    const isRendered = (!isFunction(subTab.isRendered) || isNil(subTab.isRendered(currentUser)))
      ? true
      : subTab.isRendered(currentUser)
    const isRenderedForUser = (!isFunction(subTab.isRenderedForUser) || isNil(subTab.isRenderedForUser(currentUser)))
      ? true
      : subTab.isRenderedForUser(currentUser)
    return isRendered && isRenderedForUser
  })
