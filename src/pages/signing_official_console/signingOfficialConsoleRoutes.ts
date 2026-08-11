export const SO_DASHBOARD_ROUTE = '/signing_official_console/dashboard'

export const SO_CONSOLE_SECTIONS = [
  { label: 'Researcher Status', link: '/signing_official_console/library_cards' },
  { label: 'Data Access Requests', link: '/signing_official_console/dar_requests' },
  { label: 'DAR Approvals', link: '/signing_official_console/dar_approvals' },
  { label: 'My Institution\'s Data Library', link: '/datalibrary/myinstitution' },
  { label: 'DAA Associations', link: '/signing_official_console/researchers_daa_associations' },
] as const
