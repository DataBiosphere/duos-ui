import React from 'react'
import { ClinicalTrial } from 'src/types/model'
import {
  statusToDisplay,
  phaseToDisplay,
  interventionTypeToDisplay,
} from 'src/utils/ClinicalTrialEnumUtils'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

export default function ClinicalTrialSummary(props: {
  clinicalTrial: ClinicalTrial
  columnsToShow?: (keyof ClinicalTrial | 'dateRange')[]
  editAction: () => void
  deleteAction: () => void
  viewAction?: () => void
  disabled?: boolean
}) {
  const { clinicalTrial } = props

  const customRenderers = {
    tags: (value: unknown) =>
      Array.isArray(value) && value.length > 0 ? value.join(', ') : '—',

    // computed from the startDate and endDate fields
    dateRange: () => {
      const start = clinicalTrial.startDate
      const end = clinicalTrial.endDate
      return start || end ? `${start || 'N/A'} → ${end || 'N/A'}` : '—'
    },

    // use enum display functions
    status: (value: unknown) => statusToDisplay(value as ClinicalTrial['status']),
    phase: (value: unknown) => phaseToDisplay(value as ClinicalTrial['phase']),
    interventionType: (value: unknown) =>
      interventionTypeToDisplay(value as ClinicalTrial['interventionType']),

    url: (value: unknown) =>
      typeof value === 'string' && value
        ? <a href={value} target="_blank" rel="noreferrer">{value}</a>
        : '—',
  }

  return (
    <StudyAssetSummary
      asset={clinicalTrial}
      columnsToShow={props.columnsToShow}
      customRenderers={customRenderers}
      name={clinicalTrial.title}
      objectName="clinical trial"
      editAction={props.editAction}
      deleteAction={props.deleteAction}
      viewAction={props.viewAction}
      disabled={props.disabled}
    />
  )
}
