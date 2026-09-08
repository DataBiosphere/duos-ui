import React, { useCallback, useMemo } from 'react'
import { Alert, Box, Checkbox, CircularProgress, FormControlLabel, MenuItem, Pagination, Select, Stack, Typography } from '@mui/material'
import { LibraryDataGridProps, PAGE_SIZE_OPTIONS, SortOrder, StudyAggregation } from 'src/types/library'
import { MAX_STUDY_BUCKETS } from 'src/components/data_library/assets/studyAsset'
import StudyCard from 'src/components/data_library/StudyCard'

/** Matches the sortable columns the Studies table offers, so switching views keeps the same options. */
const SORT_OPTIONS: Array<{ label: string, field: string | null, sort: SortOrder | null }> = [
  // Not "Relevance": the unsorted aggregation orders by study id, and no scoring is involved.
  { label: 'Default', field: null, sort: null },
  { label: 'Study Name (A-Z)', field: 'studyName', sort: 'asc' },
  { label: 'Study Name (Z-A)', field: 'studyName', sort: 'desc' },
  { label: 'Most Participants', field: 'totalParticipants', sort: 'desc' },
  { label: 'Most Datasets', field: 'datasetCount', sort: 'desc' },
]

export const StudyCardGrid: React.FC<LibraryDataGridProps> = ({
  data,
  loading,
  total,
  paginationModel,
  onPaginationChange,
  sortModel,
  onSortChange,
  selectedDatasetIds,
  onSelectionChange,
}) => {
  // Already ordered by the aggregation; re-sorting here would only reorder the current page.
  const studies = useMemo(
    () => (Array.isArray(data) ? data as StudyAggregation[] : []),
    [data],
  )

  const selectedIds = useMemo(() => new Set(selectedDatasetIds), [selectedDatasetIds])

  // A study reads as selected only when every dataset under it is, so a part-selected study
  // cannot be silently promoted to a full one by a checkbox it did not fill.
  const isFullySelected = useCallback(
    (study: StudyAggregation) => study.datasetIds.length > 0 && study.datasetIds.every(id => selectedIds.has(id)),
    [selectedIds],
  )

  // Applied as a delta: rebuilding from this page would discard selections made on another page
  // or on the Datasets tab.
  const applyDelta = useCallback((datasetIds: number[], select: boolean) => {
    const next = new Set(selectedDatasetIds)
    datasetIds.forEach(id => (select ? next.add(id) : next.delete(id)))
    onSelectionChange(Array.from(next))
  }, [selectedDatasetIds, onSelectionChange])

  const toggleStudy = useCallback((studyId: number) => {
    const study = studies.find(candidate => candidate.studyId === studyId)
    if (study) {
      applyDelta(study.datasetIds, !isFullySelected(study))
    }
  }, [studies, applyDelta, isFullySelected])

  const allOnPageSelected = studies.length > 0 && studies.every(isFullySelected)
  const someOnPageSelected = studies.some(study => study.datasetIds.some(id => selectedIds.has(id)))

  const toggleAllOnPage = useCallback(() => {
    applyDelta(studies.flatMap(study => study.datasetIds), !allOnPageSelected)
  }, [allOnPageSelected, studies, applyDelta])

  const activeSortIndex = useMemo(() => {
    const active = sortModel?.[0]
    const found = SORT_OPTIONS.findIndex(
      option => option.field === (active?.field ?? null) && option.sort === (active?.sort ?? null),
    )
    return found === -1 ? 0 : found
  }, [sortModel])

  // Never offer a page past what one capped aggregation can return.
  const reachable = Math.min(total, MAX_STUDY_BUCKETS)
  const pageCount = Math.max(1, Math.ceil(reachable / paginationModel.pageSize))

  if (loading && studies.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, pr: 1 }}>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <FormControlLabel
          control={(
            <Checkbox
              size="small"
              checked={allOnPageSelected}
              indeterminate={!allOnPageSelected && someOnPageSelected}
              onChange={toggleAllOnPage}
              disabled={studies.length === 0}
            />
          )}
          label={<Typography sx={{ fontSize: '1.3rem' }}>Select all on page</Typography>}
        />
        <Select
          size="small"
          value={activeSortIndex}
          onChange={(event) => {
            const option = SORT_OPTIONS[Number(event.target.value)]
            onSortChange(option.field ? [{ field: option.field, sort: option.sort }] : [])
          }}
          inputProps={{ 'aria-label': 'Sort studies' }}
          sx={{ fontSize: '1.3rem', minWidth: 200 }}
        >
          {SORT_OPTIONS.map((option, index) => (
            <MenuItem key={option.label} value={index} sx={{ fontSize: '1.3rem' }}>{option.label}</MenuItem>
          ))}
        </Select>
      </Stack>

      {studies.length === 0
        ? <Typography sx={{ fontSize: '1.4rem', color: 'text.secondary', py: 4 }}>No studies match your search.</Typography>
        : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                  lg: 'repeat(4, minmax(0, 1fr))',
                  xl: 'repeat(5, minmax(0, 1fr))',
                },
              }}
            >
              {studies.map(study => (
                <StudyCard
                  key={study.studyId}
                  study={study}
                  selected={isFullySelected(study)}
                  indeterminate={study.datasetIds.some(id => selectedIds.has(id))}
                  onToggle={toggleStudy}
                />
              ))}
            </Box>
          )}

      {total > MAX_STUDY_BUCKETS && (
        <Alert severity="info" sx={{ fontSize: '1.3rem' }}>
          {`Showing the first ${MAX_STUDY_BUCKETS.toLocaleString()} of ${total.toLocaleString()} studies. Narrow your search or filters to reach the rest.`}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ py: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
        <Pagination
          count={pageCount}
          page={paginationModel.page + 1}
          onChange={(_event, page) => onPaginationChange({ page: page - 1, pageSize: paginationModel.pageSize })}
          shape="rounded"
          color="primary"
        />
        <Select
          size="small"
          value={paginationModel.pageSize}
          onChange={event => onPaginationChange({ page: 0, pageSize: Number(event.target.value) })}
          inputProps={{ 'aria-label': 'Studies per page' }}
          sx={{ fontSize: '1.3rem' }}
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <MenuItem key={size} value={size} sx={{ fontSize: '1.3rem' }}>{`${size} per page`}</MenuItem>
          ))}
        </Select>
      </Stack>
    </Box>
  )
}

export default StudyCardGrid
