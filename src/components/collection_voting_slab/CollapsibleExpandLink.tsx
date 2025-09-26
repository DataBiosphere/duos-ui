import React from 'react'

type CollapseExpandLinkProps = {
  readonly hiddenDatasetCount: number
  readonly expanded: boolean
  readonly onExpand: () => void
  readonly onCollapse: () => void
}

export default function CollapseExpandLink(props: CollapseExpandLinkProps) {
  const {
    hiddenDatasetCount,
    expanded,
    onExpand,
    onCollapse,
  } = props

  if (hiddenDatasetCount <= 0) return null

  const linkMessage = expanded
    ? `- View ${hiddenDatasetCount} less`
    : `+ View ${hiddenDatasetCount} more`

  return (
    <button
      data-cy="collapse-expand-link"
      type="button"
      style={{
        color: '#0948B7',
        fontWeight: '500',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        textAlign: 'left' as const,
      }}
      onClick={expanded ? onCollapse : onExpand}
      aria-expanded={expanded}
    >
      {linkMessage}
    </button>
  )
}
