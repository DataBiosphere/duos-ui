import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import { DashboardDataLibrary } from 'src/libs/ajax/Dashboard'
import { ConsoleDashboardTileMeta } from './useConsoleDashboardSummary'

interface DataLibraryDashboardSummary {
  dataLibrary?: DashboardDataLibrary
}

export const createDataLibraryTile = <
  S extends DataLibraryDashboardSummary,
>(): ConsoleDashboardTileMeta<S> => ({
  label: 'Data Library',
  link: '/datalibrary',
  icon: LibraryBooksOutlinedIcon,
  description: 'Browse and search datasets, studies, and other assets available in DUOS.',
  stats: [
    { label: 'Studies', value: summary => summary.dataLibrary?.studies },
    { label: 'Datasets', value: summary => summary.dataLibrary?.datasets },
    { label: 'AI Models', value: summary => summary.dataLibrary?.models },
    { label: 'Workspaces', value: summary => summary.dataLibrary?.workspaces },
  ],
})
