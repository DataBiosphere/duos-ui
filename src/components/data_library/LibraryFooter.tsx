import React from 'react'
import { Paper, Slide, Button, Typography } from '@mui/material'
import { LibraryFooterProps } from 'src/types/library'

export const LibraryFooter: React.FC<LibraryFooterProps> = ({
  selectedDatasetIds,
  selectedStudyIds,
  onApplyForAccess,
}) => {
  const hasSelection = selectedDatasetIds.length > 0
  const datasetText = selectedDatasetIds.length === 1 ? 'dataset' : 'datasets'
  const studyText = selectedStudyIds.length === 1 ? 'study' : 'studies'

  return (
    <Slide direction="up" in={hasSelection} mountOnEnter unmountOnExit>
      <Paper
        data-cy="library-footer"
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
          {selectedStudyIds.length} {studyText}
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
