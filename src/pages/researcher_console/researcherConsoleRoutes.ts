import { DuosUser } from 'src/types/model'

export const RESEARCHER_DASHBOARD_ROUTE = '/researcher_console_dashboard'

/**
 * The Researcher Console's section pages. The Dashboard's tiles are the only advertised route to
 * them - DuosHeader registers them as sub-tabs it never renders, purely so their URLs still
 * resolve to the Researcher Console tab. Keeping both uses on one list means a tile and the tab
 * highlighting can never disagree about a route or about who is allowed to reach it.
 */
export const RESEARCHER_CONSOLE_SECTIONS = [
  { label: 'Data Access Requests', link: '/researcher_console' },
  { label: 'My Dataset Approvals', link: '/datasets' },
  {
    label: 'Data Submissions',
    link: '/dataset_submissions',
    // The route is RoleBAC-gated to data submitters, so anyone else must not be offered it.
    isRenderedForUser: (user: DuosUser): boolean => user?.isDataSubmitter === true,
  },
] as const

/**
 * Detail pages that belong to the Researcher Console but carry an id in their URL, so they can
 * never match a section link exactly. They are registered as never-rendered sub-tabs whose
 * `search` fragment claims the route, purely so a fresh load or refresh of one of them still
 * highlights this console instead of falling through to the tab that happens to come first.
 *
 * Only researcher-exclusive routes belong here. A detail route shared with another console
 * (/dar_collection/:collectionId, reachable by DAC members and signing officials too) must stay
 * unregistered, so that the tab the user actually clicked keeps the highlight.
 */
export const RESEARCHER_DETAIL_ROUTES = [
  // Covers the draft application (/dar_application/:dataRequestId) and its read-only review
  // (/dar_application_review/:collectionId) in one fragment.
  { label: 'Data Access Request Application', link: '/dar_application', search: '/dar_application' },
  { label: 'Progress Report Application', link: '/progress_report_application', search: '/progress_report_application' },
] as const
