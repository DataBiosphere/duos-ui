import React from 'react'
import { Author, Publication } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

interface PublicationSummaryProps {
  readonly publication: Publication
  readonly columnsToShow?: (keyof Publication)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function PublicationSummary(props: PublicationSummaryProps): React.JSX.Element {
  const { publication } = props

  const customRenderers = {
    authors: (value: unknown) => {
      const authors = Array.isArray(value) ? (value as Author[]) : []
      if (!authors.length) return '—'
      return (
        <span>
          {authors.map((author, i) => (
            <span key={author.orcId || `${author.name}-${i}`}>
              {author.name}{i < authors.length - 1 ? ', ' : ''}
            </span>
          ))}
        </span>
      )
    },
    url: (value: unknown) =>
      typeof value === 'string' && value
        ? <a href={value} target="_blank" rel="noreferrer">{value}</a>
        : '—',
    tags: (value: unknown) =>
      Array.isArray(value) && value.length > 0 ? (value as string[]).join(', ') : '—',
  }

  return (
    <StudyAssetSummary
      asset={publication}
      columnsToShow={props.columnsToShow}
      customRenderers={customRenderers}
      name={publication.title}
      objectName="publication"
      editAction={props.editAction}
      deleteAction={props.deleteAction}
      viewAction={props.viewAction}
      disabled={props.disabled}
    />
  )
}
