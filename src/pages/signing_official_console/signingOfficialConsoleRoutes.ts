export const SO_DASHBOARD_ROUTE = '/signing_official_console/dashboard'

/**
 * The institution-scoped view of the Data Library. It is a section of the SO Console - reached
 * from the Dashboard tile, not from the top-level Data Library tab - so DuosHeader needs to name
 * it to keep it out of the sub-tab bar while still resolving its URL to this console.
 */
export const MY_INSTITUTION_LIBRARY_ROUTE = '/datalibrary/myinstitution'

export const SO_CONSOLE_SECTIONS = [
  { label: 'Researcher Status', link: '/signing_official_console/library_cards' },
  { label: 'Data Access Requests', link: '/signing_official_console/dar_requests' },
  { label: 'DAR Approvals', link: '/signing_official_console/dar_approvals' },
  { label: 'My Institution\'s Data Library', link: MY_INSTITUTION_LIBRARY_ROUTE },
  { label: 'DAA Associations', link: '/signing_official_console/researchers_daa_associations' },
] as const
