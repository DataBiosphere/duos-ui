import React from 'react'

export function renderColumnContent(
  column: string,
  value: unknown,
  customRenderers?: Record<string, (value: unknown) => React.ReactNode>,
): React.ReactNode {
  if (customRenderers?.[column]) {
    return customRenderers[column](value)
  }
  if (Array.isArray(value)) {
    return value.map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)).join(', ')
  }
  if (value == null) return null
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}
