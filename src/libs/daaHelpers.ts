import type { DAAObject } from 'src/types/model'

/**
 * Get DAAs that were created (uploaded) by a specific DAC
 * @param daas - All available DAAs
 * @param dacId - The DAC ID to filter by
 * @returns DAAs where initialDacId matches the given dacId
 */
export function getOwnedDaas(daas: DAAObject[], dacId: number): DAAObject[] {
  return daas.filter(daa => daa.initialDacId === dacId)
}

/**
 * Get DAAs that were shared with a DAC (created by other DACs)
 * @param daas - All available DAAs
 * @param dacId - The DAC ID to filter by
 * @returns DAAs where initialDacId differs from the given dacId (excludes broad DAAs with initialDacId === dacId)
 */
export function getSharedDaas(daas: DAAObject[], dacId: number): DAAObject[] {
  return daas.filter(daa => daa.initialDacId !== dacId)
}

/**
 * Sort DAAs by creation date in ascending order (earliest first)
 * @param daas - DAAs to sort
 * @returns Sorted array (earliest creation date first)
 */
export function sortDaasByCreationDate(daas: DAAObject[]): DAAObject[] {
  return [...daas].sort((a, b) => {
    const dateA = new Date(a.createDate).getTime()
    const dateB = new Date(b.createDate).getTime()
    return dateA - dateB
  })
}

/**
 * Determine the default DAA for a DAC
 * Logic:
 *   1. If a DAA is already assigned to this DAC, return it
 *   2. If no DAA is assigned and there are shared DAAs, return the first shared DAA (by creation date)
 *   3. If no shared DAAs and there are owned DAAs, return the first owned DAA (by creation date)
 *   4. If nothing available, return null
 *
 * @param dacId - The current DAC ID
 * @param allDaas - All available DAAs
 * @param currentlyAssignedDaa - The DAA currently assigned to this DAC (if any)
 * @returns The default DAA or null
 */
export function getDefaultDaaForDac(
  dacId: number,
  allDaas: DAAObject[],
  currentlyAssignedDaa?: DAAObject,
): DAAObject | null {
  // If a DAA is already assigned, use it
  if (currentlyAssignedDaa?.daaId !== undefined) {
    return currentlyAssignedDaa
  }

  // Sort all DAAs by creation date
  const sortedDaas = sortDaasByCreationDate(allDaas)

  // Get owned and shared DAAs
  const ownedDaas = getOwnedDaas(sortedDaas, dacId)
  const sharedDaas = getSharedDaas(sortedDaas, dacId)

  // Prefer shared DAAs if available
  if (sharedDaas.length > 0) {
    return sharedDaas[0] ?? null
  }

  // Fall back to owned DAAs
  if (ownedDaas.length > 0) {
    return ownedDaas[0] ?? null
  }

  return null
}

/**
 * Determine which tab should be active by default
 * Logic:
 *   1. If a DAA is assigned, return the tab containing that DAA
 *   2. If no DAA is assigned and shared DAAs exist, default to 'shared' tab
 *   3. Otherwise, default to 'owned' tab
 *
 * @param dacId - The current DAC ID
 * @param allDaas - All available DAAs
 * @param currentlyAssignedDaa - The DAA currently assigned to this DAC (if any)
 * @returns 'owned' or 'shared' tab indicator
 */
export function getDefaultTabForDac(
  dacId: number,
  allDaas: DAAObject[],
  currentlyAssignedDaa?: DAAObject,
): 'owned' | 'shared' {
  // If a DAA is assigned, determine which tab it's in
  if (currentlyAssignedDaa?.daaId !== undefined) {
    const ownedDaas = getOwnedDaas(allDaas, dacId)
    const isOwned = ownedDaas.some(daa => daa.daaId === currentlyAssignedDaa.daaId)
    return isOwned ? 'owned' : 'shared'
  }

  // If no DAA assigned, check if there are shared DAAs
  const sharedDaas = getSharedDaas(allDaas, dacId)
  if (sharedDaas.length > 0) {
    return 'shared'
  }

  // Default to owned tab
  return 'owned'
}

/**
 * Check if a DAA is a broad/default DAA
 * @param daa - The DAA to check
 * @returns true if broadDaa is true, false otherwise
 */
export function isBroadDaa(daa: DAAObject | null | undefined): boolean {
  return daa?.broadDaa === true
}

/**
 * Check if a DAA is owned by a specific DAC
 * @param daa - The DAA to check
 * @param dacId - The DAC ID to check against
 * @returns true if the DAA is owned by the DAC, false otherwise
 */
export function isDaaOwnedByDac(daa: DAAObject, dacId: number): boolean {
  return daa.initialDacId === dacId
}
