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
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
