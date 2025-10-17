import React from 'react'

export function renderColumnContent(
  column: string,
  value: unknown,
  customRenderers?: Record<string, (value: unknown) => React.ReactNode>,
): React.ReactNode {
  // Use custom renderer if provided
  if (customRenderers?.[column]) return customRenderers[column](value)

  // Handle null/undefined
  if (value == null) return null

  // Stringify objects in arrays, convert primitives to strings
  if (Array.isArray(value)) return value.map(v => v && typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ')

  // Stringify objects, convert primitives to strings
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}
