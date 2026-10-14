export const ADMIN_DASHBOARD_ROUTE = '/admin_console/dashboard'

export const ADMIN_METRICS_ROUTE = '/admin_console/metrics'

export const ADMIN_CONSOLE_SECTIONS = [
  { label: 'Data Access Requests', link: '/admin_manage_dar_collections' },
  { label: 'DACs', link: '/manage_dac' },
  { label: 'Users', link: '/admin_manage_users' },
  { label: 'Institutions', link: '/admin_manage_institutions' },
  { label: 'Library Cards', link: '/admin_manage_lc' },
  { label: 'DAA Associations', link: '/admin_daa_associations' },
  { label: 'Email Log', link: '/admin_email_log' },
] as const
