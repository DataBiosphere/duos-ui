import React from 'react'
import { Box, Card, CardContent, Checkbox, Chip, Divider, Link, Stack, Tooltip, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined'
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlineOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import ModelTrainingOutlinedIcon from '@mui/icons-material/ModelTrainingOutlined'
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined'
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined'
import { StudyAggregation } from 'src/types/library'
import { getAccessManagementColor, getAccessManagementLabel } from 'src/components/data_library/accessManagementDisplay'

/** Beyond this the pills wrap past the card's metadata block, so the rest collapse into a count. */
const MAX_VISIBLE_DATA_TYPES = 3

interface StudyCardProps {
  study: StudyAggregation
  /** True only when every one of the study's datasets is selected. */
  selected: boolean
  /** Some but not all of the study's datasets are selected. */
  indeterminate?: boolean
  onToggle: (studyId: number) => void
}

const MetaRow = ({ icon, children }: { icon: React.ReactNode, children: React.ReactNode }) => (
  <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: 'flex-start' }}>
    <Box sx={{ 'color': 'text.disabled', 'display': 'flex', 'pt': '2px', '& svg': { fontSize: '1.8rem' } }}>{icon}</Box>
    <Box sx={{ minWidth: 0, fontSize: '1.3rem', color: 'text.secondary' }}>{children}</Box>
  </Stack>
)

const Stat = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
    <Box sx={{ 'color': 'text.disabled', 'display': 'flex', '& svg': { fontSize: '1.8rem' } }}>{icon}</Box>
    <Box>
      <Typography component="div" sx={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.1 }}>
        {value.toLocaleString()}
      </Typography>
      <Typography component="div" sx={{ fontSize: '1.1rem', color: 'text.secondary', lineHeight: 1.1 }}>
        {label}
      </Typography>
    </Box>
  </Stack>
)

const outlinedPill = { 'height': 22, 'fontSize': '1.1rem', '& .MuiChip-label': { px: 1 } }

export const StudyCard: React.FC<StudyCardProps> = ({ study, selected, indeterminate, onToggle }) => {
  const visibleDataTypes = study.dataTypes.slice(0, MAX_VISIBLE_DATA_TYPES)
  const hiddenDataTypeCount = study.dataTypes.length - visibleDataTypes.length

  return (
    <Card
      variant="outlined"
      data-cy="study-card"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Checkbox
            size="small"
            checked={selected}
            indeterminate={!selected && indeterminate}
            onChange={() => onToggle(study.studyId)}
            slotProps={{ input: { 'aria-label': `Select ${study.studyName}` } }}
            sx={{ p: 0, mt: '2px' }}
          />
          <Tooltip title={study.studyName}>
            <Link
              component={RouterLink}
              to={`/studies/${study.studyId}`}
              underline="hover"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 600,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {study.studyName}
            </Link>
          </Tooltip>
        </Stack>

        <Divider />

        <Stack spacing={1} sx={{ flex: 1 }}>
          {study.piName && (
            <MetaRow icon={<PersonOutlineIcon />}>
              PI:
              {' '}
              {study.piName}
            </MetaRow>
          )}
          {visibleDataTypes.length > 0 && (
            <MetaRow icon={<BiotechOutlinedIcon />}>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {visibleDataTypes.map(dataType => (
                  <Chip key={dataType} label={dataType} size="small" variant="outlined" sx={outlinedPill} />
                ))}
                {hiddenDataTypeCount > 0 && (
                  <Tooltip title={study.dataTypes.slice(MAX_VISIBLE_DATA_TYPES).join(', ')}>
                    <Chip label={`+${hiddenDataTypeCount}`} size="small" variant="outlined" sx={outlinedPill} />
                  </Tooltip>
                )}
              </Stack>
            </MetaRow>
          )}
          {study.species && (
            <MetaRow icon={<ScienceOutlinedIcon />}>
              Species:
              {' '}
              {study.species}
            </MetaRow>
          )}
          {study.phenotype && (
            <MetaRow icon={<DescriptionOutlinedIcon />}>
              Phenotype:
              {' '}
              {study.phenotype}
            </MetaRow>
          )}
        </Stack>

        <Divider />

        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <Stat icon={<PeopleOutlineIcon />} value={study.totalParticipants} label="Participants" />
          <Stat
            icon={<StorageOutlinedIcon />}
            value={study.datasetCount}
            label={study.datasetCount === 1 ? 'Dataset' : 'Datasets'}
          />
          {study.modelCount > 0 && (
            <Stat
              icon={<ModelTrainingOutlinedIcon />}
              value={study.modelCount}
              label={study.modelCount === 1 ? 'Model' : 'Models'}
            />
          )}
          {study.workspaceCount > 0 && (
            <Stat
              icon={<WorkspacesOutlinedIcon />}
              value={study.workspaceCount}
              label={study.workspaceCount === 1 ? 'Workspace' : 'Workspaces'}
            />
          )}
        </Stack>

        {(study.accessTypes.length > 0 || study.dataUseCodes.length > 0) && (
          <MetaRow icon={<PolicyOutlinedIcon />}>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {study.accessTypes.map(accessType => (
                <Chip
                  key={accessType}
                  label={getAccessManagementLabel(accessType)}
                  color={getAccessManagementColor(accessType)}
                  size="small"
                  variant="outlined"
                  sx={outlinedPill}
                />
              ))}
              {study.dataUseCodes.map(code => (
                <Chip key={code} label={code} size="small" variant="outlined" sx={outlinedPill} />
              ))}
            </Stack>
          </MetaRow>
        )}
      </CardContent>
    </Card>
  )
}

export default StudyCard
