/**
 * Shared column handling for the two DAA-association sub-tables.
 *
 * Both tables end in an Action column that read-only mode drops, and the DAA
 * table also gains an Institution column only on the cross-institution admin
 * view. Header and body must drop or add a column together or the cell counts
 * stop lining up, so the rules live here once.
 */

export const ACTION_COLUMN = 'Action'

/**
 * `headers` without the Action column — what a read-only view renders.
 * Views that can act on rows render their header list unchanged.
 */
export function withoutActionColumn<T extends string>(headers: readonly T[]): readonly T[] {
  return headers.filter(header => header !== ACTION_COLUMN)
}

/**
 * Percentage widths for exactly `columns`, renormalized to total 100%.
 *
 * `widths` is read as relative weights rather than final percentages: whichever
 * combination of columns a view renders, the declared widths are scaled to fill
 * the table. Without this, a dropped column leaves the widths short of 100% and
 * the browser apportions the shortfall by its own heuristic, so the same table
 * ends up with different proportions in each console.
 */
export function normalizedWidths<T extends string>(
  columns: readonly T[],
  widths: Readonly<Record<T, string>>,
): Record<string, string> {
  const weights = columns.map(column => [column, Number.parseFloat(widths[column])] as const)
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0)
  if (!total) return Object.fromEntries(columns.map(column => [column, 'auto']))

  return Object.fromEntries(
    weights.map(([column, weight]) => [column, `${((weight / total) * 100).toFixed(4)}%`]),
  )
}
