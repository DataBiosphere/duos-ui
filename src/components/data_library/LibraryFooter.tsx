import React from 'react'
import { Paper, Slide, Button, Typography } from '@mui/material'
import { uniq } from 'lodash'
import { LibraryFooterProps } from 'src/types/library'

export const LibraryFooter: React.FC<LibraryFooterProps> = ({
  selectedDatasetIds,
  datasets,
  onApplyForAccess,
}) => {
  if (selectedDatasetIds.length === 0) {
    return null
  }

  const selectedStudies = uniq(
    datasets
      .filter(dataset => selectedDatasetIds.includes(dataset.datasetId))
      .map(dataset => dataset.study.studyId),
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
          zIndex: 1200,
          backgroundColor: 'white',
          borderTop: '1px solid #DEDEDE',
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
          sx={{ fontWeight: 600 }}
        >
          Apply for Access
        </Button>
      </Paper>
    </Slide>
  )
}

export default LibraryFooter
