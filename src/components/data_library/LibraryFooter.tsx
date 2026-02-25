import React from 'react'
import { Paper, Slide, Button, Typography, Tooltip } from '@mui/material'
import { LibraryFooterProps } from 'src/types/library'
import { Storage } from 'src/libs/storage'

export const LibraryFooter: React.FC<LibraryFooterProps> = ({
  selectedDatasetIds,
  selectedStudyIds,
  onApplyForAccess,
}) => {
  const hasSelection = selectedDatasetIds.length > 0
  const datasetText = selectedDatasetIds.length === 1 ? 'dataset' : 'datasets'
  const studyText = selectedStudyIds.length === 1 ? 'study' : 'studies'
  const hasLibraryCard = Storage.getCurrentUser()?.libraryCard != null

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
              size="large"
              onClick={onApplyForAccess}
              sx={{ fontWeight: 600 }}
              disabled={!hasLibraryCard}
            >
              Apply for Access
            </Button>
          </span>
        </Tooltip>
      </Paper>
    </Slide>
  )
}

export default LibraryFooter
