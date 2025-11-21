# Data Library Feature Rebuild

**Date:** November 21, 2025  
**Status:** Planning  
**Version:** 2.0

---

## Overview

This document outlines the complete rebuild of the DUOS Data Library feature with a focus on performance optimization, modern UI patterns, and better user experience through Material UI and TypeScript.

### Goals

1. **Modernize the UI** - Use standard React/TypeScript patterns with Material UI components instead of custom logic
2. **Improve Performance** - Implement server-side pagination instead of loading all datasets at once
3. **Optimize Grouping** - Use ElasticSearch aggregations for study grouping instead of client-side JavaScript
4. **Enhance Maintainability** - Convert to TypeScript with proper type safety and modern React patterns

---

## Current Architecture

### Entry Points
- **Main Component**: `src/pages/DatasetSearch.jsx`
- **Table Component**: `src/components/data_search/DatasetSearchTable.jsx`
- **Display Component**: `src/components/data_search/DatasetSearchTableDisplay.tsx`

### Current Data Flow

```
DatasetSearch.jsx (Entry Point)
    ↓
    - Assembles ElasticSearch query based on library version
    - Fetches ALL datasets (size: 10000) from backend
    - Passes datasets to DatasetSearchTable
    ↓
DatasetSearchTable.jsx (Main Logic)
    ↓
    - Manages filters, search, and tab selection
    - Re-queries ElasticSearch for filtering/searching
    - Groups datasets by study in JavaScript
    - Passes filtered data to DatasetSearchTableDisplay
    ↓
DatasetSearchTableDisplay.tsx (Presentation)
    ↓
    - Client-side pagination
    - Displays paginated results
```

### Key Components

1. **DatasetSearch.jsx**
   - Fetches library version configuration from `libraryVersions.ts`
   - Builds initial ElasticSearch query with visibility modifiers
   - Loads all datasets on page load (up to 10,000 records)
   - Current query structure:
     ```json
     {
       "from": 0,
       "size": 10000,
       "query": {
         "bool": {
           "must": [
             { "match": { "_type": "dataset" } },
             { "exists": { "field": "study" } },
             // ... additional filters
           ]
         }
       }
     }
     ```

2. **DatasetSearchTable.jsx**
   - Manages UI state: filters, search term, selected datasets
   - Re-queries ElasticSearch when filters/search changes
   - Groups datasets into studies using JavaScript:
     ```javascript
     const studyGroups = groupBy(datasets, 'study.studyId')
     ```
   - Renders header, tabs, filters, and table display

3. **DatasetSearchTableDisplay.tsx**
   - Implements client-side pagination
   - Sorts data in browser
   - Renders SimpleTable with paginated rows

4. **DatasetSearchTableConstants.tsx**
   - Defines tab configurations (study vs dataset views)
   - Contains column header definitions and cell rendering functions
   - ~510 lines of complex table configuration

5. **DatasetFilterList.tsx**
   - Renders left sidebar filters
   - Filter categories:
     - Access Management
     - Data Use
     - Data Type
     - DAC (Data Access Committee)
     - Participant Count Range

### Library Versions

The `libraryVersions.ts` file defines 30+ different library "brands" (views):
- Each brand has: query, icon, title, featured flag, order
- Examples: DUOS, Broad, AnVIL, NHGRI, eLwazi, etc.
- Queries filter datasets by institution, description, or other criteria

### Current Issues

1. **Performance Bottlenecks**
   - Loads up to 10,000 datasets on initial page load
   - Re-queries entire dataset collection for every filter/search change
   - Client-side grouping of datasets into studies is computationally expensive
   - Excessive re-renders due to non-memoized values

2. **Complex State Management**
   - Multiple components managing overlapping state
   - Filter state duplicated across query and UI
   - Search and filter trigger separate ElasticSearch queries

3. **Custom Components**
   - Custom table implementation (`SimpleTable`) instead of Material UI DataGrid
   - Custom pagination logic
   - Custom checkbox and selection logic

4. **Code Organization**
   - Mixed JSX and TSX files
   - Large files with multiple responsibilities
   - Complex makeHeaders/makeRows pattern in Constants file

---

## Proposed Architecture

### High-Level Design

```
DatasetLibrary.tsx (New Entry Point)
    ↓
    - Initializes library configuration
    - Manages URL state and navigation
    ↓
LibraryHeader.tsx (Header Section)
    ↓
    - Icon, title, description
    - Search bar
    ↓
LibraryTabs.tsx (Tab Navigation)
    ↓
    - Studies, Datasets, (Future: AI Models)
    ↓
LibraryContent.tsx (Main Content Area)
    ↓
    ├── LibraryFilters.tsx (Left Sidebar)
    │   - Access Management
    │   - Data Use
    │   - Data Type
    │   - DAC
    │   - Participant Count
    │
    └── LibraryDataGrid.tsx (Data Table)
        ↓
        - Material UI DataGrid
        - Server-side pagination
        - Server-side sorting
        - Column configuration per tab
        ↓
LibraryFooter.tsx (Selection Footer)
    ↓
    - Shows selected count
    - "Apply for Access" button
```

### Core Improvements

#### 1. Server-Side Pagination

**Current Approach:**
```javascript
// Load everything
const fullQuery = {
  from: 0,
  size: 10000,
  query: { /* ... */ }
}
```

**New Approach:**
```typescript
interface PaginationParams {
  page: number
  pageSize: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

const buildPaginatedQuery = (
  baseQuery: ElasticsearchQuery,
  pagination: PaginationParams,
  filters: FilterState
): ElasticsearchQuery => {
  return {
    from: pagination.page * pagination.pageSize,
    size: pagination.pageSize,
    sort: pagination.sortField 
      ? [{ [pagination.sortField]: { order: pagination.sortOrder } }]
      : undefined,
    query: {
      bool: {
        must: baseQuery.must,
        filter: buildFilterQuery(filters)
      }
    }
  }
}
```

**Benefits:**
- Only load data needed for current page (e.g., 25-100 records)
- Faster initial load time
- Reduced memory usage
- Better for large datasets

#### 2. ElasticSearch Aggregations for Study Grouping

**Current Approach:**
```javascript
// Client-side grouping in JavaScript
const studyGroups = groupBy(allDatasets, 'study.studyId')
const studyRows = Object.values(studyGroups).map(datasets => {
  return formatStudyRow(datasets)
})
```

**New Approach:**
```typescript
// Server-side aggregation query
const studyAggregationQuery = {
  size: 0, // Don't return documents
  aggs: {
    studies: {
      terms: {
        field: 'study.studyId',
        size: pageSize
      },
      aggs: {
        study_info: {
          top_hits: {
            size: 1,
            _source: ['study.*']
          }
        },
        dataset_count: {
          value_count: {
            field: 'datasetId'
          }
        },
        total_participants: {
          sum: {
            field: 'participantCount'
          }
        },
        datasets: {
          top_hits: {
            size: 1000, // Max datasets per study
            _source: ['datasetId', 'datasetIdentifier', 'accessManagement']
          }
        }
      }
    }
  }
}
```

**Benefits:**
- ElasticSearch does grouping efficiently
- Can paginate through studies directly
- Get aggregated counts (participants, datasets) without loading all data
- Significant performance improvement for large datasets

#### 3. Material UI DataGrid Integration

**Current:** Custom `SimpleTable` with manual pagination, sorting, selection

**New:** Material UI DataGrid with built-in features

```typescript
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid'

const LibraryDataGrid = (props: LibraryDataGridProps) => {
  const { assetType, onSelectionChange } = props
  
  const columns: GridColDef[] = useMemo(() => 
    getColumnsForAssetType(assetType),
    [assetType]
  )
  
  return (
    <DataGrid
      columns={columns}
      rows={rows}
      pagination
      paginationMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
      checkboxSelection
      disableRowSelectionOnClick
      rowSelectionModel={selectionModel}
      onRowSelectionModelChange={handleSelectionChange}
      loading={loading}
      sortingMode="server"
      onSortModelChange={handleSortChange}
      // Disable selection for open/external access
      isRowSelectable={(params) => 
        params.row.accessManagement !== 'open' && 
        params.row.accessManagement !== 'external'
      }
    />
  )
}
```

**Benefits:**
- Checkbox selection built-in
- Pagination UI built-in
- Sorting built-in
- Virtualization for large datasets
- Accessibility features included
- Consistent Material UI styling
- Less custom code to maintain

#### 4. Modern React Patterns

**State Management:**
```typescript
// Use URL state for shareable filters/pagination
const [searchParams, setSearchParams] = useSearchParams()

// Use React Query for server state
const { data, isLoading, error } = useQuery({
  queryKey: ['datasets', filters, pagination],
  queryFn: () => fetchDatasets(filters, pagination)
})

// Use standard React `setState` for UI state
const useLibraryStore = create<LibraryState>((set) => ({
  selectedDatasets: [],
  addSelection: (ids) => set((state) => ({
    selectedDatasets: [...state.selectedDatasets, ...ids]
  })),
  clearSelection: () => set({ selectedDatasets: [] })
}))
```

**Component Structure:**
```typescript
// Separate concerns clearly
interface LibraryContentProps {
  libraryConfig: LibraryVersion
  assetType: AssetType
}

export const LibraryContent: React.FC<LibraryContentProps> = ({
  libraryConfig,
  assetType
}) => {
  const [filters, setFilters] = useFilters()
  const [pagination, setPagination] = usePagination()
  const { data, isLoading } = useDatasetQuery(
    libraryConfig,
    assetType,
    filters,
    pagination
  )
  
  return (
    <Box sx={{ display: 'flex' }}>
      <LibraryFilters 
        filters={filters}
        onChange={setFilters}
      />
      <LibraryDataGrid
        assetType={assetType}
        data={data}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </Box>
  )
}
```

---

## Detailed Component Specifications

### 1. LibraryHeader Component

**Purpose:** Display library branding, description, and search functionality

**Props:**
```typescript
interface LibraryHeaderProps {
  icon: string | null
  title: string
  description: string
  searchTerm: string
  onSearchChange: (term: string) => void
  onClearSearch: () => void
}
```

**UI Structure:**
```
┌─────────────────────────────────────────────────────┐
│  [Icon]  Library Title                              │
│          Library Description                        │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │  🔍 Enter search terms...                │ Clear │
│  └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Material UI `TextField` for search with search icon
- Debounced search input (300ms)
- Clear button to reset search
- Responsive layout

**Implementation Notes:**
- Use `TableHeaderSection` as reference but modernize with MUI components
- Search should update URL params for shareability
- Implement `useDebouncedValue` hook for search

---

### 2. LibraryTabs Component

**Purpose:** Navigate between different asset types (Studies, Datasets, future: AI Models)

**Props:**
```typescript
interface LibraryTabsProps {
  value: AssetType
  onChange: (assetType: AssetType) => void
  tabs: TabConfig[]
}

interface TabConfig {
  key: AssetType
  label: string
  icon?: React.ReactNode
  count?: number
}

enum AssetType {
  STUDIES = 'studies',
  DATASETS = 'datasets',
  AI_MODELS = 'ai-models' // Future
}
```

**UI Structure:**
```
┌─────────────────────────────────────────────────────┐
│  [ View by Studies ]  [ View by Datasets ]          │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Material UI `Tabs` component
- Underline indicator for active tab
- Optional counts per tab (e.g., "123 Studies")
- Keyboard navigation support

**Implementation Notes:**
- Use `value` and `onChange` pattern (controlled component)
- Store selected tab in URL for deep linking
- Extensible design for future asset types

---

### 3. LibraryFilters Component

**Purpose:** Left sidebar with faceted filtering options

**Props:**
```typescript
interface LibraryFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
  availableFilters: AvailableFilters
  loading?: boolean
}

interface FilterState {
  accessManagement: string[]
  dataUse: string[]
  dataType: string[]
  dac: string[]
  participantCount: {
    min?: number
    max?: number
  }
}

interface AvailableFilters {
  accessManagement: FilterOption[]
  dataUse: FilterOption[]
  dataType: FilterOption[]
  dac: FilterOption[]
  participantCountRange: {
    min: number
    max: number
  }
}

interface FilterOption {
  value: string
  label: string
  count?: number // Number of results with this filter
}
```

**UI Structure:**
```
┌───────────────────┐
│  Filters   [Clear]│
│                   │
│  Access Mgmt      │
│  ☑ Controlled (45)│
│  ☐ Open (12)      │
│  ☐ External (8)   │
│                   │
│  Data Use         │
│  ☐ GRU (23)       │
│  ☐ HMB (15)       │
│  ☐ DS (34)        │
│                   │
│  Data Type        │
│  ☐ WGS (12)       │
│  ☐ Array (8)      │
│                   │
│  DAC              │
│  ☐ DAC 1 (15)     │
│  ☐ DAC 2 (8)      │
│                   │
│  Participants     │
│  Min: [    ]      │
│  Max: [    ]      │
└───────────────────┘
```

**Features:**
- Material UI `Accordion` for collapsible sections
- Material UI `Checkbox` for multi-select
- Material UI `Slider` or `TextField` for numeric ranges
- Show document counts per filter option
- "Clear All Filters" button at top
- Sticky positioning while scrolling

**Implementation Notes:**
- Use ElasticSearch aggregations to get filter counts
- Update URL params when filters change
- Disable filters with 0 results
- Use `FormGroup` and `FormControlLabel` for accessibility

---

### 4. LibraryDataGrid Component

**Purpose:** Main data table with server-side pagination, sorting, and selection

**Props:**
```typescript
interface LibraryDataGridProps {
  assetType: AssetType
  libraryConfig: LibraryVersion
  filters: FilterState
  searchTerm: string
  onSelectionChange: (selectedIds: number[]) => void
}
```

**Column Definitions:**

**Studies View:**
```typescript
const studyColumns: GridColDef[] = [
  {
    field: 'studyName',
    headerName: 'Study Name',
    flex: 1.5,
    minWidth: 200,
    renderCell: (params) => (
      <Link href={`/studies/${params.row.studyId}`}>
        {params.value}
      </Link>
    )
  },
  {
    field: 'participantCount',
    headerName: 'Participants',
    width: 120,
    type: 'number'
  },
  {
    field: 'phenotype',
    headerName: 'Phenotype',
    flex: 1,
    minWidth: 150
  },
  {
    field: 'species',
    headerName: 'Species',
    width: 120
  },
  {
    field: 'piName',
    headerName: 'PI Name',
    width: 150
  },
  {
    field: 'dataCustodian',
    headerName: 'Data Custodian',
    flex: 1,
    minWidth: 150
  }
]
```

**Datasets View:**
```typescript
const datasetColumns: GridColDef[] = [
  {
    field: 'datasetName',
    headerName: 'Dataset Name',
    flex: 1.5,
    minWidth: 200,
    renderCell: (params) => (
      <Link href={`/dataset/${params.row.datasetId}`}>
        {params.value}
      </Link>
    )
  },
  {
    field: 'studyName',
    headerName: 'Study Name',
    flex: 1,
    minWidth: 150
  },
  {
    field: 'participantCount',
    headerName: 'Participants',
    width: 120,
    type: 'number'
  },
  {
    field: 'dataUse',
    headerName: 'Data Use',
    width: 150,
    renderCell: (params) => (
      <DataUseCell codes={params.value} />
    )
  },
  {
    field: 'accessManagement',
    headerName: 'Access',
    width: 120,
    renderCell: (params) => (
      <AccessBadge type={params.value} />
    )
  },
  {
    field: 'dac',
    headerName: 'DAC',
    width: 150
  },
  {
    field: 'export',
    headerName: 'Export',
    width: 100,
    sortable: false,
    renderCell: (params) => (
      <DatasetExportButton 
        datasetId={params.row.datasetId}
      />
    )
  }
]
```

**Features:**
- Server-side pagination (page size: 25, 50, 100)
- Server-side sorting
- Multi-row selection with checkboxes
- Row click for details navigation
- Conditional row selection (disable for open/external)
- Loading skeleton states
- Empty state messaging
- Export button per dataset row
- Responsive column sizing
- Sticky header
- Cell tooltips for overflow content

**Implementation Notes:**
```typescript
const LibraryDataGrid: React.FC<LibraryDataGridProps> = (props) => {
  const { assetType, filters, searchTerm, onSelectionChange } = props
  
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25
  })
  
  const [sortModel, setSortModel] = useState<GridSortModel>([])
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['library-data', assetType, filters, searchTerm, paginationModel, sortModel],
    queryFn: () => fetchLibraryData({
      assetType,
      filters,
      searchTerm,
      pagination: paginationModel,
      sort: sortModel[0]
    })
  })
  
  const columns = useMemo(() => 
    assetType === AssetType.STUDIES ? studyColumns : datasetColumns,
    [assetType]
  )
  
  return (
    <DataGrid
      rows={data?.items || []}
      columns={columns}
      rowCount={data?.total || 0}
      loading={isLoading}
      pageSizeOptions={[25, 50, 100]}
      paginationModel={paginationModel}
      paginationMode="server"
      onPaginationModelChange={setPaginationModel}
      sortingMode="server"
      sortModel={sortModel}
      onSortModelChange={setSortModel}
      checkboxSelection
      disableRowSelectionOnClick
      onRowSelectionModelChange={onSelectionChange}
      isRowSelectable={(params) => 
        params.row.accessManagement !== 'open' &&
        params.row.accessManagement !== 'external'
      }
      sx={{
        '& .MuiDataGrid-cell:focus': {
          outline: 'none'
        }
      }}
    />
  )
}
```

---

### 5. LibraryFooter Component

**Purpose:** Fixed footer showing selection summary and "Apply for Access" button

**Props:**
```typescript
interface LibraryFooterProps {
  selectedDatasetIds: number[]
  datasets: DatasetTerm[] // For calculating study count
  onApplyForAccess: () => void
}
```

**UI Structure:**
```
┌─────────────────────────────────────────────────────┐
│  12 datasets selected from 3 studies   [Apply for Access] │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Fixed position at bottom of viewport
- Only visible when items are selected
- Slide-in animation
- Summary text with correct pluralization
- Primary action button
- Responsive layout (stack on mobile)

**Implementation Notes:**
```typescript
const LibraryFooter: React.FC<LibraryFooterProps> = ({
  selectedDatasetIds,
  datasets,
  onApplyForAccess
}) => {
  if (selectedDatasetIds.length === 0) return null
  
  const selectedStudies = uniq(
    datasets
      .filter(d => selectedDatasetIds.includes(d.datasetId))
      .map(d => d.study.studyId)
  )
  
  const datasetText = selectedDatasetIds.length === 1 ? 'dataset' : 'datasets'
  const studyText = selectedStudies.length === 1 ? 'study' : 'studies'
  
  return (
    <Slide direction="up" in={true}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 2,
          zIndex: 1200
        }}
      >
        <Typography variant="body1">
          {selectedDatasetIds.length} {datasetText} selected from{' '}
          {selectedStudies.length} {studyText}
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={onApplyForAccess}
        >
          Apply for Access
        </Button>
      </Paper>
    </Slide>
  )
}
```

---

## API Integration

### Current API Endpoint

```
POST /api/dataset/search/index
```

**Current Request:**
```json
{
  "from": 0,
  "size": 10000,
  "query": {
    "bool": {
      "must": [
        { "match": { "_type": "dataset" } },
        { "exists": { "field": "study" } }
      ]
    }
  }
}
```

**Current Response:**
```json
[
  {
    "datasetId": 1234,
    "datasetIdentifier": "DUOS-000123",
    "datasetName": "Example Dataset",
    "study": {
      "studyId": 456,
      "studyName": "Example Study",
      "description": "...",
      "piName": "Dr. Smith",
      "species": "Human",
      "phenotype": "Disease X"
    },
    "participantCount": 500,
    "accessManagement": "controlled",
    "dac": {
      "dacId": 1,
      "dacName": "Example DAC"
    },
    "dataUse": {
      "primary": { "code": "GRU" },
      "secondary": []
    }
  }
]
```

### Proposed API Updates

#### 1. Paginated Dataset Search

**Endpoint:** `POST /api/dataset/search/index` (enhanced)

**Request:**
```typescript
interface DatasetSearchRequest {
  // Pagination
  from: number
  size: number
  
  // Base query
  query: {
    bool: {
      must: QueryClause[]
      filter?: QueryClause[]
    }
  }
  
  // Sorting
  sort?: Array<{
    [field: string]: {
      order: 'asc' | 'desc'
    }
  }>
  
  // Optional: Request aggregations for filter counts
  aggs?: {
    [key: string]: AggregationDefinition
  }
}
```

**Response:**
```typescript
interface DatasetSearchResponse {
  items: DatasetTerm[]
  total: number
  aggregations?: {
    [key: string]: AggregationResult
  }
}
```

**Example Request with Aggregations:**
```json
{
  "from": 0,
  "size": 25,
  "query": {
    "bool": {
      "must": [
        { "match": { "_type": "dataset" } },
        { "exists": { "field": "study" } }
      ]
    }
  },
  "sort": [
    { "study.studyName": { "order": "asc" } }
  ],
  "aggs": {
    "access_management": {
      "terms": { "field": "accessManagement" }
    },
    "data_use": {
      "terms": { "field": "dataUse.primary.code" }
    },
    "data_type": {
      "terms": { "field": "study.dataTypes" }
    },
    "dac": {
      "terms": { "field": "dac.dacName" }
    }
  }
}
```

**Example Response:**
```json
{
  "items": [ /* 25 datasets */ ],
  "total": 1234,
  "aggregations": {
    "access_management": {
      "buckets": [
        { "key": "controlled", "doc_count": 980 },
        { "key": "open", "doc_count": 234 },
        { "key": "external", "doc_count": 20 }
      ]
    },
    "data_use": {
      "buckets": [
        { "key": "GRU", "doc_count": 456 },
        { "key": "HMB", "doc_count": 234 }
      ]
    }
  }
}
```

#### 2. Study View Using Aggregations

**Endpoint:** `POST /api/dataset/search/index` (SAME ENDPOINT)

**Purpose:** Get study-grouped data using ElasticSearch aggregations

**Request for Studies Tab:**
```json
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        { "match": { "_type": "dataset" } },
        { "exists": { "field": "study" } }
      ]
    }
  },
  "aggs": {
    "studies": {
      "composite": {
        "size": 25,
        "sources": [
          { "study_id": { "terms": { "field": "study.studyId" } } }
        ]
      },
      "aggs": {
        "study_details": {
          "top_hits": {
            "size": 1,
            "_source": ["study.*"]
          }
        },
        "dataset_count": {
          "value_count": { "field": "datasetId" }
        },
        "total_participants": {
          "sum": { "field": "participantCount" }
        },
        "dataset_ids": {
          "terms": {
            "field": "datasetId",
            "size": 10000
          }
        }
      }
    }
  }
}
```

**Response:**
```json
{
  "items": [],
  "total": 0,
  "aggregations": {
    "studies": {
      "buckets": [
        {
          "key": { "study_id": 456 },
          "doc_count": 5,
          "study_details": {
            "hits": {
              "hits": [
                {
                  "_source": {
                    "study": {
                      "studyId": 456,
                      "studyName": "Example Study",
                      "piName": "Dr. Smith",
                      "species": "Human",
                      "phenotype": "Disease X"
                    }
                  }
                }
              ]
            }
          },
          "dataset_count": { "value": 5 },
          "total_participants": { "value": 2500 },
          "dataset_ids": {
            "buckets": [
              { "key": 1234 },
              { "key": 1235 },
              { "key": 1236 },
              { "key": 1237 },
              { "key": 1238 }
            ]
          }
        }
      ],
      "after_key": { "study_id": 456 }
    }
  }
}
```

**Frontend Processing:**
```typescript
// Transform aggregation response to study rows
const transformStudyAggregations = (response: ElasticsearchResponse): StudyRow[] => {
  const buckets = response.aggregations?.studies?.buckets || []
  
  return buckets.map(bucket => ({
    studyId: bucket.key.study_id,
    studyName: bucket.study_details.hits.hits[0]._source.study.studyName,
    piName: bucket.study_details.hits.hits[0]._source.study.piName,
    species: bucket.study_details.hits.hits[0]._source.study.species,
    phenotype: bucket.study_details.hits.hits[0]._source.study.phenotype,
    dataCustodianEmail: bucket.study_details.hits.hits[0]._source.study.dataCustodianEmail,
    datasetCount: bucket.dataset_count.value,
    totalParticipants: bucket.total_participants.value,
    datasetIds: bucket.dataset_ids.buckets.map(b => b.key)
  }))
}
```

**Benefits:**
- Uses same endpoint as datasets (no new API needed)
- ElasticSearch handles grouping and aggregation
- Efficient pagination with `after_key`
- Pre-aggregated counts reduce client-side computation
- Filter aggregations work the same way

---

## TypeScript Type Definitions

### Core Types

```typescript
// Asset types
export enum AssetType {
  STUDIES = 'studies',
  DATASETS = 'datasets',
  AI_MODELS = 'ai-models' // Future
}

// Library configuration
export interface LibraryVersion {
  key: string
  query: ElasticsearchQuery | null
  icon: string | null
  title: string
  description: string
  featured: boolean
  order: number
}

// Filter state
export interface FilterState {
  accessManagement: string[]
  dataUse: string[]
  dataType: string[]
  dac: string[]
  participantCount: {
    min?: number
    max?: number
  }
}

// Pagination state
export interface PaginationState {
  page: number
  pageSize: number
}

// Sort state
export interface SortState {
  field: string
  order: 'asc' | 'desc'
}

// Dataset model (matches backend)
export interface DatasetTerm {
  datasetId: number
  datasetIdentifier: string
  datasetName: string
  study: StudyInfo
  participantCount: number
  accessManagement: 'controlled' | 'open' | 'external'
  dacApproval: boolean
  dac: DACInfo
  dataUse: DataUseInfo
  dataLocation: string
  // ... other fields
}

// Study model (for aggregated view)
export interface StudyAggregation {
  studyId: number
  studyName: string
  studyDescription: string
  piName: string
  species: string
  phenotype: string
  dataCustodianEmail: string[]
  datasetCount: number
  totalParticipants: number
  datasetIds: number[]
  accessTypes: string[]
}

// API response types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  aggregations?: Record<string, AggregationResult>
}

export interface AggregationResult {
  buckets: Array<{
    key: string
    doc_count: number
  }>
}
```

---

## State Management Strategy

### URL State (for shareability)

Store these in URL search params:
- Current library/brand
- Active tab (studies vs datasets)
- Search term
- Active filters
- Current page
- Sort field/order

```typescript
// Example URL
/datalibrary/broad?tab=studies&search=cancer&access=controlled&page=2

const useLibraryUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const state = {
    library: searchParams.get('library') || 'duos',
    tab: searchParams.get('tab') as AssetType || AssetType.STUDIES,
    search: searchParams.get('search') || '',
    filters: parseFiltersFromUrl(searchParams),
    page: parseInt(searchParams.get('page') || '0'),
    sortField: searchParams.get('sort'),
    sortOrder: searchParams.get('order') as 'asc' | 'desc'
  }
  
  const updateState = (updates: Partial<typeof state>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, String(value))
      } else {
        newParams.delete(key)
      }
    })
    setSearchParams(newParams)
  }
  
  return [state, updateState] as const
}
```

### Server State (React Query)

Use React Query for all server data:

```typescript
// Custom hooks for data fetching
export const useLibraryData = (
  libraryConfig: LibraryVersion,
  assetType: AssetType,
  filters: FilterState,
  searchTerm: string,
  pagination: PaginationState,
  sort?: SortState
) => {
  return useQuery({
    queryKey: ['library-data', libraryConfig.key, assetType, filters, searchTerm, pagination, sort],
    queryFn: () => {
      const query = buildElasticsearchQuery(
        libraryConfig,
        assetType,
        filters,
        searchTerm,
        pagination,
        sort
      )
      
      // Use same endpoint for both, just different query structures
      const response = await DataSet.searchDatasetIndex(query)
      
      // Transform aggregations to study rows if needed
      if (assetType === AssetType.STUDIES && response.aggregations) {
        return transformStudyAggregations(response)
      }
      
      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}

export const useFilterOptions = (
  libraryConfig: LibraryVersion,
  filters: FilterState,
  searchTerm: string
) => {
  return useQuery({
    queryKey: ['filter-options', libraryConfig.key, filters, searchTerm],
    queryFn: () => {
      const query = buildAggregationQuery(libraryConfig, filters, searchTerm)
      return DataSet.getFilterAggregations(query)
    },
    staleTime: 2 * 60 * 1000
  })
}

export const useExportableDatasets = (datasetIds: number[]) => {
  return useQuery({
    queryKey: ['exportable-datasets', datasetIds],
    queryFn: () => TerraDataRepo.listSnapshotsByDatasetIds(datasetIds),
    enabled: datasetIds.length > 0
  })
}
```

### UI State (Local Component State)

Keep these in local component state using standard React `useState`:
- Selection state (selected dataset IDs)
- Expanded/collapsed filter sections
- Temporary input values (before debounce)

```typescript
const LibraryContent = () => {
  // Selection managed locally
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([])
  
  // Filter expansion state
  const [expandedFilters, setExpandedFilters] = useState<string[]>([
    'accessManagement',
    'dataUse'
  ])
  
  return (
    // ...
  )
}
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1-2)

1. **Create new TypeScript types**
   - Define all interfaces in `src/types/library.ts`
   - Update existing `DatasetTerm` type if needed
   
2. **Set up React Query**
   - Install `@tanstack/react-query`
   - Create `QueryProvider` wrapper
   - Create custom hooks for data fetching

3. **Create basic component structure**
   - `LibraryLayout.tsx` - Main container
   - `LibraryHeader.tsx` - Header section
   - `LibraryTabs.tsx` - Tab navigation
   - Verify basic navigation works

### Phase 2: Dataset View (Week 3-4)

1. **Implement Dataset DataGrid**
   - Install `@mui/x-data-grid`
   - Create `LibraryDataGrid.tsx` with dataset columns
   - Implement server-side pagination
   - Add sorting support

2. **Implement Filters**
   - Create `LibraryFilters.tsx`
   - Add each filter type (checkboxes, range)
   - Connect filters to query
   - Show filter counts from aggregations

3. **Add Search**
   - Implement debounced search
   - Update query builder
   - Add clear search functionality

4. **Selection & Footer**
   - Implement row selection
   - Create `LibraryFooter.tsx`
   - Connect "Apply for Access" flow

### Phase 3: Study View (Week 5-6)

1. **Study Aggregation Queries**
   - Build ElasticSearch aggregation queries for studies
   - Test composite aggregations with pagination
   - Implement response transformation logic

2. **Study DataGrid**
   - Create study column definitions
   - Handle study-specific rendering
   - Implement expandable rows (optional: show datasets)

3. **Study Selection Logic**
   - Handle study-level selection
   - Translate to dataset selection
   - Update footer calculations

### Phase 4: Testing & Optimization (Week 7-8)

1. **Performance Testing**
   - Test with 10,000+ datasets
   - Profile render performance
   - Optimize re-renders with memoization

2. **Unit Tests**
   - Test query builders
   - Test filter logic
   - Test selection logic

3. **Integration Tests**
   - Test filter + search combinations
   - Test pagination edge cases
   - Test selection persistence

4. **E2E Tests (Cypress)**
   - Test full user workflows
   - Test all library brands
   - Test accessibility

### Phase 5: Migration & Cleanup (Week 9-10)

1. **Feature Flag**
   - Add toggle for new vs old library
   - Enable for testing

2. **Gradual Rollout**
   - Internal testing
   - Beta testing with select users
   - Full rollout

3. **Remove Old Code**
   - Delete old components
   - Remove unused dependencies
   - Update documentation

---

## File Structure

### New Files to Create

```
src/
├── pages/
│   └── DataLibrary.tsx (NEW - replaces DatasetSearch.jsx)
│
├── components/
│   └── data_library/ (NEW - replaces data_search/)
│       ├── LibraryLayout.tsx
│       ├── LibraryHeader.tsx
│       ├── LibraryTabs.tsx
│       ├── LibraryFilters.tsx
│       ├── LibraryDataGrid.tsx
│       ├── LibraryFooter.tsx
│       ├── columns/
│       │   ├── studyColumns.tsx
│       │   ├── datasetColumns.tsx
│       │   └── columnHelpers.tsx
│       └── cells/
│           ├── DataUseBadge.tsx
│           ├── AccessBadge.tsx
│           └── ExportButton.tsx
│
├── hooks/
│   ├── useLibraryData.ts (NEW)
│   ├── useLibraryFilters.ts (NEW)
│   ├── useLibraryUrlState.ts (NEW)
│   └── useDebouncedValue.ts (NEW)
│
├── libs/
│   ├── ajax/
│   │   └── DataSet.ts (UPDATE - add new methods)
│   └── queries/
│       ├── datasetQueries.ts (NEW)
│       └── studyQueries.ts (NEW)
│
└── types/
    └── library.ts (NEW)
```

### Files to Modify

```
src/libs/ajax/DataSet.js → DataSet.ts
  - Update searchDatasetIndex to handle aggregation responses
  - Add proper TypeScript types for responses
  - Support both dataset and study query patterns

src/libs/libraryVersions.ts
  - Update return type
  - Add description field

src/routing/ (route configuration)
  - Update route to new component
  - Maintain backward compatibility
```

### Files to Delete (After Migration)

```
src/pages/DatasetSearch.jsx
src/components/data_search/
  - DatasetSearchTable.jsx
  - DatasetSearchTableDisplay.tsx
  - DatasetSearchTableConstants.tsx
  - DatasetFilterList.tsx
  - DatasetFilterConstants.tsx
  - DatasetSearchFooter.tsx
```

---

## Performance Targets

### Current Performance (Baseline)

- **Initial Load:** ~3-5 seconds (loading 10,000 records)
- **Filter Change:** ~500ms-1s (re-querying ElasticSearch)
- **Search:** ~500ms-1s (re-querying ElasticSearch)
- **Memory:** ~50-100MB (all datasets in memory)

### Target Performance (Goals)

- **Initial Load:** <1 second (loading 25-100 records)
- **Filter Change:** <200ms (server-side filtering)
- **Search:** <300ms (debounced + server-side)
- **Pagination:** <200ms (cached or prefetched)
- **Memory:** <10MB (only visible data in memory)

### Optimization Techniques

1. **Lazy Loading**
   - Only load current page
   - Prefetch next page
   - Virtual scrolling for very large pages

2. **Memoization**
   - Memoize column definitions
   - Memoize computed values
   - Use React.memo for expensive components

3. **Debouncing**
   - Search input: 300ms
   - Filter changes: 150ms
   - Window resize: 200ms

4. **Caching**
   - React Query cache (5 min stale time)
   - LocalStorage for preferences
   - Service Worker for assets

5. **Code Splitting**
   - Lazy load DataGrid
   - Lazy load chart libraries
   - Lazy load export functionality

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

1. **Keyboard Navigation**
   - All interactive elements must be keyboard accessible
   - Logical tab order
   - Focus indicators visible
   - Escape key to close modals/menus

2. **Screen Reader Support**
   - Proper ARIA labels on all inputs
   - Table with proper headers
   - Status messages announced
   - Loading states announced

3. **Color Contrast**
   - Minimum 4.5:1 for text
   - 3:1 for large text
   - Focus indicators visible

4. **Form Controls**
   - All inputs have labels
   - Error messages associated with inputs
   - Required fields marked

### Implementation Notes

```typescript
// Proper ARIA labels
<TextField
  label="Search datasets"
  aria-label="Search datasets by name or description"
  aria-describedby="search-help-text"
/>

// Table accessibility
<DataGrid
  aria-label="Dataset library table"
  getRowId={(row) => row.datasetId}
  // ... other props
/>

// Selection announcement
<LiveRegion>
  {selectedCount} datasets selected
</LiveRegion>

// Loading states
<DataGrid
  loading={isLoading}
  aria-busy={isLoading}
  aria-live="polite"
/>
```

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

```typescript
// Example: Filter logic tests
describe('LibraryFilters', () => {
  it('should update URL when filter is selected', () => {
    const { getByLabelText } = render(<LibraryFilters />)
    fireEvent.click(getByLabelText('Controlled'))
    expect(window.location.search).toContain('access=controlled')
  })
  
  it('should show filter counts from aggregations', async () => {
    const { getByText } = render(<LibraryFilters />)
    await waitFor(() => {
      expect(getByText('Controlled (123)')).toBeInTheDocument()
    })
  })
})

// Example: DataGrid tests
describe('LibraryDataGrid', () => {
  it('should paginate correctly', async () => {
    const { getByLabelText } = render(<LibraryDataGrid />)
    fireEvent.click(getByLabelText('Next page'))
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ from: 25 })
    )
  })
  
  it('should disable selection for open access datasets', () => {
    const { getAllByRole } = render(<LibraryDataGrid />)
    const checkboxes = getAllByRole('checkbox')
    expect(checkboxes[1]).toBeDisabled() // First data row, open access
  })
})
```

### Integration Tests (Cypress)

```typescript
// Example: Full workflow test
describe('Data Library', () => {
  it('should filter, search, and select datasets', () => {
    cy.visit('/datalibrary')
    
    // Apply filters
    cy.get('[data-cy=filter-controlled]').click()
    cy.get('[data-cy=filter-gru]').click()
    
    // Search
    cy.get('[data-cy=search-input]').type('cancer')
    
    // Wait for results
    cy.get('[data-cy=data-grid]').should('contain', 'cancer')
    
    // Select datasets
    cy.get('[data-cy=select-all-checkbox]').click()
    
    // Apply for access
    cy.get('[data-cy=apply-access-button]').click()
    cy.url().should('include', '/dar_application')
  })
  
  it('should persist state in URL', () => {
    cy.visit('/datalibrary?access=controlled&search=cancer')
    cy.get('[data-cy=filter-controlled]').should('be.checked')
    cy.get('[data-cy=search-input]').should('have.value', 'cancer')
  })
})
```

### Performance Tests

```typescript
// Measure initial load time
describe('Performance', () => {
  it('should load initial page in under 1 second', () => {
    const start = performance.now()
    render(<DataLibrary />)
    const end = performance.now()
    expect(end - start).toBeLessThan(1000)
  })
  
  it('should handle 10000 rows without memory issues', () => {
    const initialMemory = performance.memory.usedJSHeapSize
    render(<LibraryDataGrid />, {
      initialState: { rowCount: 10000 }
    })
    const finalMemory = performance.memory.usedJSHeapSize
    expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024) // 10MB
  })
})
```

---

## Open Questions & Decisions Needed

1. **Study Aggregation Strategy**
   - Use composite aggregations for pagination
   - How to optimize aggregation performance for large datasets?
   - Should we cache aggregation results?

2. **Export Functionality**
   - Keep per-row export buttons?
   - Add bulk export for selected datasets?
   - How to show export availability indicators?

3. **AI Models Tab**
   - When to implement?
   - What fields to display?
   - Different selection logic?

4. **Mobile Responsiveness**
   - How should filters appear on mobile? (Drawer vs collapse?)
   - Should we hide some columns on small screens?
   - Different layout for selection footer?

5. **Advanced Features**
   - Saved searches/filters?
   - Comparison mode?
   - Dataset bookmarking?
   - Email alerts for new datasets?

6. **Feature Flag Strategy**
   - Config-based toggle?
   - User-based rollout?
   - A/B testing?

---

## Success Metrics

### Performance Metrics

- [ ] Initial page load < 1 second
- [ ] Filter application < 200ms
- [ ] Search results < 300ms
- [ ] Pagination < 200ms
- [ ] Memory usage < 10MB

### User Experience Metrics

- [ ] Reduced time to find datasets (measure with analytics)
- [ ] Increased dataset selection rate
- [ ] Reduced bounce rate
- [ ] Positive user feedback

### Technical Metrics

- [ ] Code coverage > 80%
- [ ] TypeScript strict mode enabled
- [ ] Zero accessibility violations
- [ ] All E2E tests passing
- [ ] Bundle size reduced by 20%

---

## Dependencies

### New Dependencies to Add

```json
{
  "@tanstack/react-query": "^5.0.0",
  "@mui/x-data-grid": "^6.0.0",
  "@mui/x-data-grid-pro": "^6.0.0" // If needed for advanced features
}
```

### Dependencies to Remove (After Migration)

```json
{
  // Custom table dependencies (if any)
}
```

---

## Resources & References

### Material UI Documentation
- [DataGrid](https://mui.com/x/react-data-grid/)
- [Server-side data](https://mui.com/x/react-data-grid/server-side-data/)
- [Row selection](https://mui.com/x/react-data-grid/row-selection/)

### ElasticSearch Documentation
- [Aggregations](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html)
- [Composite aggregations](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-composite-aggregation.html)
- [Search API](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html)

### React Query Documentation
- [Queries](https://tanstack.com/query/latest/docs/react/guides/queries)
- [Pagination](https://tanstack.com/query/latest/docs/react/guides/paginated-queries)

---

## Appendix

### A. Current vs Proposed Query Comparison

**Current - Load All Datasets:**
```javascript
{
  from: 0,
  size: 10000,
  query: { /* ... */ }
}
// Returns: 10,000 datasets (~5MB response)
// Time: 3-5 seconds
```

**Proposed - Paginated:**
```typescript
{
  from: 0,
  size: 25,
  query: { /* ... */ },
  sort: [{ 'study.studyName': { order: 'asc' } }],
  aggs: { /* filter counts */ }
}
// Returns: 25 datasets + aggregations (~50KB response)
// Time: <500ms
```

### B. Component Hierarchy Diagram

```
App
└── Router
    └── DataLibrary (page)
        ├── LibraryHeader
        │   ├── Icon
        │   ├── Title
        │   └── SearchBar
        ├── LibraryTabs
        │   ├── StudiesTab
        │   └── DatasetsTab
        └── LibraryContent
            ├── LibraryFilters (sidebar)
            │   ├── FilterAccordion (Access Management)
            │   ├── FilterAccordion (Data Use)
            │   ├── FilterAccordion (Data Type)
            │   ├── FilterAccordion (DAC)
            │   └── FilterAccordion (Participant Count)
            ├── LibraryDataGrid (main content)
            │   ├── DataGrid (MUI)
            │   │   ├── Toolbar
            │   │   ├── Header Row
            │   │   ├── Data Rows
            │   │   │   ├── Checkbox Cell
            │   │   │   ├── Data Cells
            │   │   │   └── Action Cell (Export)
            │   │   └── Pagination
            │   └── EmptyState
            └── LibraryFooter (fixed, conditional)
                ├── Selection Summary
                └── Apply for Access Button
```

### C. ElasticSearch Query Examples

**Study Aggregation with Composite:**
```json
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        { "match": { "_type": "dataset" } },
        { "exists": { "field": "study" } }
      ]
    }
  },
  "aggs": {
    "studies": {
      "composite": {
        "size": 25,
        "sources": [
          { "study_id": { "terms": { "field": "study.studyId" } } }
        ],
        "after": { "study_id": 123 }
      },
      "aggs": {
        "study_name": {
          "top_hits": {
            "size": 1,
            "_source": ["study.studyName"]
          }
        },
        "dataset_count": {
          "cardinality": { "field": "datasetId" }
        },
        "total_participants": {
          "sum": { "field": "participantCount" }
        }
      }
    }
  }
}
```

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-21 | 1.0 | Initial document created | GitHub Copilot |
| 2025-11-21 | 1.1 | Update state and aggregations | FB | 

**End of Document**
