import { uniq, filter, isNil } from 'lodash'
import { Button } from '@mui/material'
import * as React from 'react'
import { DatasetTerm } from 'src/types/model'
import { Storage } from 'src/libs/storage'
import Tooltip from '@mui/material/Tooltip'

interface DatasetSearchFooterProps {
  selectedDatasets: number[]
  datasets: DatasetTerm[]
  onClick: () => void
}
export const DatasetSearchFooter = (props: DatasetSearchFooterProps) => {
  const { selectedDatasets, datasets, onClick } = props
  const selectedStudies = uniq(
    filter(datasets, dataset => selectedDatasets.includes(dataset.datasetId))
      .map(dataset => dataset.study.studyId))
  const datasetText = selectedDatasets.length > 1 ? 'datasets' : 'dataset'
  const studyText = selectedStudies.length > 1 ? 'studies' : 'study'
  const hasLibraryCard = !isNil(Storage.getCurrentUser().libraryCard)

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      zIndex: 999,
      width: '100vw',
      height: 60,
      display: 'flex',
      justifyContent: 'flex-end',
      backgroundColor: 'white',
      border: '1px solid #DEDEDE',
      alignItems: 'center',
    }}
    >
      <div style={{ paddingRight: 15 }}>
        {selectedDatasets.length}
        {' '}
        {datasetText}
        {' '}
        selected from
        {' '}
        {selectedStudies.length}
        {' '}
        {studyText}
      </div>
      <Tooltip
        title={hasLibraryCard ? '' : 'A Library Card is required to apply for data access'}
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: 'red',
              color: 'white',
            },
          },
        }}
      >
        <span>
          <Button
            variant="contained"
            onClick={onClick}
            sx={{ fontWeight: 600, marginRight: 5 }}
            disabled={!hasLibraryCard}
          >
            Apply for Access
          </Button>
        </span>
      </Tooltip>
    </div>
  )
}
