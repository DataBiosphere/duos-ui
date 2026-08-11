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
