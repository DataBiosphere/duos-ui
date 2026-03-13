import React from 'react'
import { Maintainer, ClinicalTrial, Presenter, Author } from 'src/types/model'

export function renderMaintainer(value: unknown): React.ReactNode {
  const maintainer = value as Maintainer
  if (!maintainer || typeof maintainer !== 'object') return '—'
  return <span>{maintainer.name}{maintainer.email ? ` (${maintainer.email})` : ''}</span>
}

export function renderUrl(value: unknown): React.ReactNode {
  return typeof value === 'string' && value
    ? <a href={value} target="_blank" rel="noreferrer">{value}</a>
    : '—'
}

export function renderValue(value: unknown): React.ReactNode {
  return typeof value === 'string' && value ? value : '—'
}

export function renderArray(value: unknown): string {
  return Array.isArray(value) && value.length > 0 ? value.join(', ') : '—'
}

export function renderPresenter(value: unknown): React.ReactNode {
  const presenter = value as Presenter
  if (!presenter || typeof presenter !== 'object') return '—'
  return <span>{presenter.name}{presenter.email ? ` (${presenter.email})` : ''}</span>
}

export function renderAuthors(value: unknown): React.ReactNode {
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
}

const renderersByColumn: Record<string, (value: unknown, asset?: unknown) => React.ReactNode> = {
  maintainer: renderMaintainer,
  trainedOnDatasets: renderArray,
  tags: renderArray,
  tools: renderArray,
  url: renderUrl,
  filingDate: renderValue,
  presenter: renderPresenter,
  authors: renderAuthors,
  dateRange: (_, asset) => {
    const clinicalTrial = asset as ClinicalTrial
    const start = clinicalTrial?.startDate
    const end = clinicalTrial?.endDate
    return start || end ? `${start || 'N/A'} → ${end || 'N/A'}` : '—'
  },
}

export function renderColumnContent(column: string, value: unknown, asset?: unknown): React.ReactNode {
  if (renderersByColumn[column]) return renderersByColumn[column](value, asset)
  if (value == null) return '—'
  if (Array.isArray(value)) return value.map(v => v && typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value as string | number | boolean)
}
