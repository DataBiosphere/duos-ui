import React, { useCallback, useMemo } from 'react'
import { Box, Checkbox, CircularProgress, FormControlLabel, MenuItem, Pagination, Select, Stack, Typography } from '@mui/material'
import { LibraryDataGridProps, SortOrder, StudyAggregation } from 'src/types/library'
import { studyAsset } from 'src/components/data_library/assets/studyAsset'
import { LibraryRow } from 'src/components/data_library/assets/definition'
import StudyCard from 'src/components/data_library/StudyCard'

/** Matches the sortable columns the Studies table offers, so switching views keeps the same options. */
const SORT_OPTIONS: Array<{ label: string, field: string | null, sort: SortOrder | null }> = [
  { label: 'Relevance', field: null, sort: null },
  { label: 'Study Name (A-Z)', field: 'studyName', sort: 'asc' },
  { label: 'Study Name (Z-A)', field: 'studyName', sort: 'desc' },
  { label: 'Most Participants', field: 'totalParticipants', sort: 'desc' },
  { label: 'Most Datasets', field: 'datasetCount', sort: 'desc' },
]

const PAGE_SIZES = [10, 25, 50, 100]

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
  const studies = useMemo(
    () => (Array.isArray(data) ? data as StudyAggregation[] : []),
    [data],
  )

  // Reuses the asset's own selection maths so a study means the same set of datasets in either view.
  const selectedStudyIds = useMemo(
    () => studyAsset.computeRowSelection(studies as LibraryRow[], selectedDatasetIds),
    [studies, selectedDatasetIds],
  )

  const applySelection = useCallback((studyIds: Array<string | number>) => {
    onSelectionChange(studyAsset.selectionToDatasetIds(studies as LibraryRow[], studyIds))
  }, [studies, onSelectionChange])

  const toggleStudy = useCallback((studyId: number) => {
    const next = new Set(selectedStudyIds)
    if (next.has(studyId)) {
      next.delete(studyId)
    }
    else {
      next.add(studyId)
    }
    applySelection(Array.from(next))
  }, [selectedStudyIds, applySelection])

  const allOnPageSelected = studies.length > 0 && studies.every(study => selectedStudyIds.has(study.studyId))

  const toggleAllOnPage = useCallback(() => {
    applySelection(allOnPageSelected ? [] : studies.map(study => study.studyId))
  }, [allOnPageSelected, studies, applySelection])

  const activeSortIndex = useMemo(() => {
    const active = sortModel?.[0]
    const found = SORT_OPTIONS.findIndex(
      option => option.field === (active?.field ?? null) && option.sort === (active?.sort ?? null),
    )
    return found === -1 ? 0 : found
  }, [sortModel])

  const pageCount = Math.max(1, Math.ceil(total / paginationModel.pageSize))

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
              indeterminate={!allOnPageSelected && studies.some(study => selectedStudyIds.has(study.studyId))}
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
                  selected={selectedStudyIds.has(study.studyId)}
                  onToggle={toggleStudy}
                />
              ))}
            </Box>
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
          {PAGE_SIZES.map(size => (
            <MenuItem key={size} value={size} sx={{ fontSize: '1.3rem' }}>{`${size} per page`}</MenuItem>
          ))}
        </Select>
      </Stack>
    </Box>
  )
}

export default StudyCardGrid
