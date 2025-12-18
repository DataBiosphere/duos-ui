import React from 'react'
import { Presentation, Presenter } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

interface PresentationSummaryProps {
  readonly presentation: Presentation
  readonly columnsToShow?: (keyof Presentation)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function PresentationSummary(props: PresentationSummaryProps): React.JSX.Element {
  const { presentation } = props

  const customRenderers = {
    presenter: (value: unknown) => {
      const presenter = value as Presenter
      if (!presenter || typeof presenter !== 'object') return '—'
      return <span>{presenter.name}{presenter.email ? ` (${presenter.email})` : ''}</span>
    },
    url: (value: unknown) =>
      typeof value === 'string' && value
        ? <a href={value} target="_blank" rel="noreferrer">{value}</a>
        : '—',
    tags: (value: unknown) =>
      Array.isArray(value) && value.length > 0 ? value.join(', ') : '—',
  }

  return (
    <StudyAssetSummary
      asset={presentation}
      columnsToShow={props.columnsToShow}
      customRenderers={customRenderers}
      name={presentation.title}
      objectName="presentation"
      editAction={props.editAction}
      deleteAction={props.deleteAction}
      viewAction={props.viewAction}
      disabled={props.disabled}
    />
  )
}
