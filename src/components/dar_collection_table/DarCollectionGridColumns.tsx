import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Chip, Tooltip } from '@mui/material'
import { Link } from 'react-router'
import { formatDate } from 'src/libs/utils'
import { includes, isEmpty, isNil, toLower, uniq } from 'src/utils/NodashUtil'
import { consoleTypes } from 'src/utils/DarCollectionUtils'
import { DarCollectionSummary, DataUseGroup } from 'src/types/model'
import { dataUseTooltip, orderDataUseCodes } from 'src/utils/DataUseUtils'
import Actions from 'src/components/dar_collection_table/Actions'
import DarCollectionAdminReviewLink from 'src/components/dar_collection_table/DarCollectionAdminReviewLink'
import DataUseVoteStatusBadges from 'src/components/dar_collection_table/DataUseVoteStatusBadges'

// One grid row per (collection, data-use group) pair, so every group gets its own pill,
// vote badges, and dataset count. Collection-level columns are visually merged back together
// across a collection's rows via `rowSpanValueGetter` keyed on darCollectionId.
export interface DarCollectionGridRow {
  id: string
  collection: DarCollectionSummary
  group: DataUseGroup | null
}

export function buildDarCollectionGridRows(
  collections: DarCollectionSummary[],
): DarCollectionGridRow[] {
  return collections.flatMap((collection): DarCollectionGridRow[] => {
    const groups = collection.dataUseGroups ?? []
    if (groups.length === 0) {
      return [{ id: `${collection.darCollectionId}-empty`, collection, group: null }]
    }
    return groups.map(group => ({
      id: `${collection.darCollectionId}-${group.key}`,
      collection,
      group,
    }))
  })
}

export interface MakeDarCollectionColumnsArgs {
  consoleType: string
  goToVote?: (collectionId: number) => void
  showConfirmationModal: (collection: DarCollectionSummary, action: string) => void
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
    const { group } = params.row
    if (!group) {
      return <span>0</span>
    }

    const datasetTooltip = group.datasets.map(dataset => `${dataset.name} (${dataset.datasetIdentifier})`).join(', ')
    return (
      <Tooltip title={datasetTooltip}>
        <span style={{ cursor: 'default' }}>{group.datasets.length}</span>
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
    const { group } = params.row
    if (!group) {
      return <span>No datasets</span>
    }

    const terms = orderDataUseCodes(group)
    if (terms.length === 0) {
      return null
    }

    return (
      <Tooltip
        title={(
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {terms.map((term, index) => <li key={`${term.shortCode}-${index}`}>{dataUseTooltip(term)}</li>)}
          </Box>
        )}
        describeChild
      >
        <Chip
          label={terms.map(term => term.shortCode).join('-')}
          size="small"
          variant="outlined"
          color="primary"
          tabIndex={0}
          sx={{ maxWidth: '100%' }}
        />
      </Tooltip>
    )
  },
})

// Never spans: votes are cast per data-use group's election, not per collection. Only
// rendered for Chair/Member consoles — the only column list that includes 'votes' at all.
const votesColumn = ({ consoleType }: MakeDarCollectionColumnsArgs): GridColDef<DarCollectionGridRow> => ({
  field: 'votes',
  headerName: 'Votes',
  flex: 1,
  minWidth: 160,
  sortable: false,
  rowSpanValueGetter: (_value, row) => row.id,
  renderCell: (params) => {
    const { group } = params.row
    if (!group || (consoleType !== consoleTypes.CHAIR && consoleType !== consoleTypes.MEMBER)) {
      return null
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <DataUseVoteStatusBadges memberVotes={group.votes} />
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
