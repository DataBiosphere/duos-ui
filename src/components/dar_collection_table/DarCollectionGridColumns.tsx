import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Chip, Skeleton, Tooltip } from '@mui/material'
import { Link } from 'react-router'
import { formatDate } from 'src/libs/utils'
import { includes, isEmpty, isNil, toLower, uniq } from 'src/utils/NodashUtil'
import { collapseVotesByUser, consoleTypes, extractDacDataAccessVotesFromBucket } from 'src/utils/DarCollectionUtils'
import { DarCollectionSummary } from 'src/types/model'
import { Bucket } from 'src/utils/BucketUtils'
import Actions from 'src/components/dar_collection_table/Actions'
import DarCollectionAdminReviewLink from 'src/components/dar_collection_table/DarCollectionAdminReviewLink'
import DataUseVoteStatusBadges from 'src/components/dar_collection_table/DataUseVoteStatusBadges'
import { DataUseBucketsState } from 'src/components/dar_collection_table/useDarCollectionDataUseBuckets'

// One grid row per (collection, data-use group) pair, so every group gets its own pill,
// vote badges, and dataset count. Collection-level columns are visually merged back together
// across a collection's rows via `rowSpanValueGetter` keyed on darCollectionId.
export interface DarCollectionGridRow {
  id: string
  collection: DarCollectionSummary
  bucket: Bucket | null
  bucketState: 'loading' | 'loaded' | 'error'
}

export function buildDarCollectionGridRows(
  collections: DarCollectionSummary[],
  bucketsByCollectionId: Record<number, DataUseBucketsState>,
): DarCollectionGridRow[] {
  return collections.flatMap((collection): DarCollectionGridRow[] => {
    const state = bucketsByCollectionId[collection.darCollectionId]

    if (!state || state.status === 'loading') {
      return [{ id: `${collection.darCollectionId}-loading`, collection, bucket: null, bucketState: 'loading' }]
    }
    if (state.status === 'error') {
      return [{ id: `${collection.darCollectionId}-error`, collection, bucket: null, bucketState: 'error' }]
    }
    if (state.buckets.length === 0) {
      return [{ id: `${collection.darCollectionId}-empty`, collection, bucket: null, bucketState: 'loaded' }]
    }
    return state.buckets.map(bucket => ({
      id: `${collection.darCollectionId}-${bucket.key}`,
      collection,
      bucket,
      bucketState: 'loaded' as const,
    }))
  })
}

export interface MakeDarCollectionColumnsArgs {
  consoleType: string
  goToVote?: (collectionId: number) => void
  showConfirmationModal: (collection: DarCollectionSummary, action: string) => void
  currentUser: { userId: number }
}

// Spans a collection-level column down across every row belonging to the same collection.
const spanByCollection = (_value: unknown, row: DarCollectionGridRow) => row.collection.darCollectionId

const dacLinkToCollection = (darCode: string, darCollectionId: number, status = ''): React.ReactElement => {
  const hasOpenElections = includes(toLower(status), 'open')
  const path = hasOpenElections
    ? `/dar_collection/${darCollectionId}`
    : `/dar_vote_review/${darCollectionId}`
  return <Link to={path}>{darCode}</Link>
}

const darCodeColumn = ({ consoleType }: MakeDarCollectionColumnsArgs): GridColDef<DarCollectionGridRow> => ({
  field: 'darCode',
  headerName: 'DAR Code',
  flex: 1,
  minWidth: 110,
  rowSpanValueGetter: spanByCollection,
  renderCell: (params) => {
    const { darCollectionId, darCode, status } = params.row.collection
    switch (consoleType) {
      case consoleTypes.ADMIN:
        return <DarCollectionAdminReviewLink darCollectionId={darCollectionId} darCode={darCode} />
      case consoleTypes.CHAIR:
      case consoleTypes.MEMBER:
      case consoleTypes.SIGNING_OFFICIAL:
        return dacLinkToCollection(darCode, darCollectionId, status)
      default:
        return darCode
    }
  },
})

const dacNamesColumn = (): GridColDef<DarCollectionGridRow> => ({
  field: 'dacNames',
  headerName: 'DAC',
  flex: 0.8,
  minWidth: 100,
  rowSpanValueGetter: spanByCollection,
  valueGetter: (_value, row) => uniq(row.collection.dacNames).join(', '),
  renderCell: params => (
    <Tooltip title={params.value}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{params.value}</span>
    </Tooltip>
  ),
})

const nameColumn = (): GridColDef<DarCollectionGridRow> => ({
  field: 'name',
  headerName: 'Title',
  flex: 1.5,
  minWidth: 160,
  rowSpanValueGetter: spanByCollection,
  valueGetter: (_value, row) => (isEmpty(row.collection.name) ? '- -' : row.collection.name),
})

const submissionDateColumn = (): GridColDef<DarCollectionGridRow> => ({
  field: 'submissionDate',
  headerName: 'Submission Date',
  flex: 1,
  minWidth: 130,
  type: 'number',
  rowSpanValueGetter: spanByCollection,
  valueGetter: (_value, row) => {
    const { submissionDate } = row.collection
    if (isNil(submissionDate) || toLower(String(submissionDate)) === 'unsubmitted') {
      return null
    }
    return Number(submissionDate)
  },
  valueFormatter: value => (isNil(value) ? '- -' : formatDate(value)),
})

const researcherColumn = (): GridColDef<DarCollectionGridRow> => ({
  field: 'researcher',
  headerName: 'Researcher',
  flex: 1,
  minWidth: 110,
  rowSpanValueGetter: spanByCollection,
  valueGetter: (_value, row) => row.collection.researcherName || '- -',
})

const institutionColumn = (): GridColDef<DarCollectionGridRow> => ({
  field: 'institution',
  headerName: 'Institution',
  flex: 1.2,
  minWidth: 120,
  rowSpanValueGetter: spanByCollection,
  valueGetter: (_value, row) => row.collection.institutionName || '- -',
})

// Never spans: shows the dataset count for this row's specific data-use group, not the
// collection total, so each group's count must stand on its own.
const datasetCountColumn = (): GridColDef<DarCollectionGridRow> => ({
  field: 'datasetCount',
  headerName: 'Datasets',
  width: 100,
  type: 'number',
  sortable: false,
  rowSpanValueGetter: (_value, row) => row.id,
  renderCell: (params) => {
    const { bucket, bucketState } = params.row

    if (bucketState === 'loading') {
      return <Skeleton variant="rounded" width={24} height={24} />
    }
    if (bucketState === 'error') {
      return <span>—</span>
    }
    if (!bucket) {
      return <span>0</span>
    }

    const datasetTooltip = bucket.datasets.map(dataset => `${dataset.name} (${dataset.datasetIdentifier})`).join(', ')
    return (
      <Tooltip title={datasetTooltip}>
        <span style={{ cursor: 'default' }}>{bucket.datasets.length}</span>
      </Tooltip>
    )
  },
})

const expiresAtColumn = (): GridColDef<DarCollectionGridRow> => ({
  field: 'expiresAt',
  headerName: 'Expiration Date',
  flex: 1,
  minWidth: 130,
  type: 'number',
  rowSpanValueGetter: spanByCollection,
  valueGetter: (_value, row) => (isNil(row.collection.expiresAt) ? null : row.collection.expiresAt),
  valueFormatter: value => (isNil(value) ? '- -' : formatDate(value)),
})

const statusColumn = (): GridColDef<DarCollectionGridRow> => ({
  field: 'status',
  headerName: 'Status',
  flex: 0.8,
  minWidth: 100,
  rowSpanValueGetter: spanByCollection,
  valueGetter: (_value, row) => row.collection.status || '- -',
  renderCell: params => <span style={{ color: '#333F52', fontWeight: 600 }}>{params.value}</span>,
})

// Never spans: each row's data-use group is unique to that row, even within the same collection.
const dataUseColumn = (): GridColDef<DarCollectionGridRow> => ({
  field: 'dataUse',
  headerName: 'Data Use',
  flex: 1.5,
  minWidth: 200,
  sortable: false,
  rowSpanValueGetter: (_value, row) => row.id,
  renderCell: (params) => {
    const { bucket, bucketState } = params.row

    if (bucketState === 'loading') {
      return <Skeleton variant="rounded" width={160} height={24} />
    }
    if (bucketState === 'error') {
      return <span>—</span>
    }
    if (!bucket) {
      return <span>No datasets</span>
    }

    return (
      <Tooltip title={bucket.label}>
        <Chip
          label={bucket.label}
          size="small"
          variant="outlined"
          sx={{ 'maxWidth': '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
        />
      </Tooltip>
    )
  },
})

// Never spans: votes are cast per data-use group's election, not per collection. Only
// rendered for Chair/Member consoles — the only column list that includes 'votes' at all.
const votesColumn = ({ consoleType, currentUser }: MakeDarCollectionColumnsArgs): GridColDef<DarCollectionGridRow> => ({
  field: 'votes',
  headerName: 'Votes',
  flex: 1,
  minWidth: 160,
  sortable: false,
  rowSpanValueGetter: (_value, row) => row.id,
  renderCell: (params) => {
    const { bucket, bucketState } = params.row

    if (bucketState === 'loading') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Skeleton variant="rounded" width={80} height={24} />
        </Box>
      )
    }
    if (bucketState === 'error' || !bucket) {
      return null
    }
    if (consoleType !== consoleTypes.CHAIR && consoleType !== consoleTypes.MEMBER) {
      return null
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <DataUseVoteStatusBadges
          memberVotes={collapseVotesByUser(extractDacDataAccessVotesFromBucket({ votes: bucket.votes }, currentUser, false))}
        />
      </Box>
    )
  },
})

const actionsColumn = ({ consoleType, goToVote, showConfirmationModal }: MakeDarCollectionColumnsArgs): GridColDef<DarCollectionGridRow> => ({
  field: 'actions',
  headerName: 'Action',
  flex: 1.6,
  minWidth: 260,
  sortable: false,
  rowSpanValueGetter: spanByCollection,
  renderCell: params => (
    <Actions
      collection={params.row.collection}
      consoleType={consoleType}
      showConfirmationModal={showConfirmationModal}
      goToVote={goToVote}
      actions={params.row.collection.actions}
      status={params.row.collection.status}
    />
  ),
})

const columnFactories: Record<string, (args: MakeDarCollectionColumnsArgs) => GridColDef<DarCollectionGridRow>> = {
  darCode: darCodeColumn,
  dacNames: dacNamesColumn,
  name: nameColumn,
  submissionDate: submissionDateColumn,
  researcher: researcherColumn,
  institution: institutionColumn,
  datasetCount: datasetCountColumn,
  dataUse: dataUseColumn,
  votes: votesColumn,
  expiresAt: expiresAtColumn,
  status: statusColumn,
  actions: actionsColumn,
}

export function makeDarCollectionColumns(
  columns: string[],
  args: MakeDarCollectionColumnsArgs,
): GridColDef<DarCollectionGridRow>[] {
  return columns
    .filter(column => Boolean(columnFactories[column]))
    .map(column => columnFactories[column](args))
}
