import React, { useRef } from 'react'
import { Box } from '@mui/material'
import LibraryTabs from 'src/components/data_library/LibraryTabs'
import SearchBar from 'src/components/SearchBar'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { useLibraryUrlState } from 'src/hooks/useLibraryUrlState'
import { AssetType, TabConfig } from 'src/types/library'

/**
 * DataLibrary Page Component
 *
 * Main page for browsing and searching datasets and studies in DUOS.
 * Features:
 * - Tabbed interface for Studies vs Datasets views
 * - Advanced filtering sidebar
 * - Server-side pagination and sorting
 * - Multi-select with Apply for Access functionality
 * - URL-based state for shareability
 *
 * State Management:
 * - URL state: filters, pagination, sort, search, active tab (managed by useLibraryUrlState)
 * - Server state: data fetching, caching (managed by React Query via useLibraryData)
 * - Local UI state: selection tracking (useState)
 */
export const DataLibrary: React.FC = () => {
  const [urlState, updateUrlState] = useLibraryUrlState()

  const searchRef = useRef<HTMLInputElement>(null)

  const tabs: TabConfig[] = [
    { key: AssetType.STUDIES, label: 'Studies' },
    { key: AssetType.DATASETS, label: 'Datasets' },
  ]

  const handleTabChange = (newAssetType: AssetType) => {
    updateUrlState({ tab: newAssetType })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <Box>
        <TableHeaderSection
          title="DUOS Data Library"
          description="Search, filter, and select datasets, then click 'Apply for Access' to request access"
        />
        <SearchBar
          handleSearchChange={() => {}}
          searchRef={searchRef}
          style={{
            paddingTop: '10px',
          }}
        />
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 3, pt: 2 }}>
        <LibraryTabs
          value={urlState.tab}
          onChange={handleTabChange}
          tabs={tabs}
        />
      </Box>
    </Box>
  )
}

export default DataLibrary
