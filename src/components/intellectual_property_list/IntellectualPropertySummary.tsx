import React from 'react'
import { IntellectualProperty } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

interface IntellectualPropertySummaryProps {
  readonly intellectualProperty: IntellectualProperty
  readonly columnsToShow?: (keyof IntellectualProperty)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function IntellectualPropertySummary(props: IntellectualPropertySummaryProps): React.JSX.Element {
  const { intellectualProperty } = props

  const customRenderers = {
    url: (value: unknown) =>
      typeof value === 'string' && value
        ? <a href={value} target="_blank" rel="noreferrer">{value}</a>
        : '—',
    tags: (value: unknown) =>
      Array.isArray(value) && value.length > 0 ? value.join(', ') : '—',
    filingDate: (value: unknown) => typeof value === 'string' && value ? value : '—',
  }

  return (
    <StudyAssetSummary
      asset={intellectualProperty}
      columnsToShow={props.columnsToShow}
      customRenderers={customRenderers}
      name={intellectualProperty.title || intellectualProperty.type}
      objectName="intellectual property"
      editAction={props.editAction}
      deleteAction={props.deleteAction}
      viewAction={props.viewAction}
      disabled={props.disabled}
    />
  )
}
