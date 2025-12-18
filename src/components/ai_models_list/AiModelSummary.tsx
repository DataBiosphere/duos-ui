import React from 'react'
import { AiModel, Maintainer } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

export default function AiModelSummary(props: {
  aiModel: AiModel
  columnsToShow?: (keyof AiModel)[]
  editAction: () => void
  deleteAction: () => void
  viewAction?: () => void
  disabled?: boolean
}) {
  const { aiModel } = props

  const customRenderers = {
    maintainer: (value: unknown) => {
      const maintainer = value as Maintainer
      if (!maintainer || typeof maintainer !== 'object') return '—'
      return <span>{maintainer.name}{maintainer.email ? ` (${maintainer.email})` : ''}</span>
    },
    trainedOnDatasets: (value: unknown) => Array.isArray(value) && value.length > 0 ? value.join(', ') : '—',
    tags: (value: unknown) => Array.isArray(value) && value.length > 0 ? value.join(', ') : '—',
    url: (value: unknown) =>
      typeof value === 'string' && value
        ? <a href={value} target="_blank" rel="noreferrer">{value}</a>
        : '—',
  }

  return (
    <StudyAssetSummary
      asset={aiModel}
      columnsToShow={props.columnsToShow}
      customRenderers={customRenderers}
      name={aiModel.name}
      objectName="AI model"
      editAction={props.editAction}
      deleteAction={props.deleteAction}
      viewAction={props.viewAction}
      disabled={props.disabled}
    />
  )
}
