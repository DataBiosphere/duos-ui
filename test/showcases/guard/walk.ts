/** Calls `visit` for every object in `value`, depth first, with its dotted path (`sections.hero`). */
export const walkObjects = (value: unknown, visit: (node: Record<string, unknown>, path: string) => void, path = ''): void => {
  if (value === null || typeof value !== 'object') {
    return
  }
  visit(value as Record<string, unknown>, path)
  Object.entries(value).forEach(([key, child]) => walkObjects(child, visit, path ? `${path}.${key}` : key))
}
