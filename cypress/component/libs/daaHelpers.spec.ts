import type { DAAObject } from 'src/types/model'
import {
  getOwnedDaas,
  getSharedDaas,
  sortDaasByCreationDate,
  getDefaultDaaForDac,
  getDefaultTabForDac,
  isDaaOwnedByDac,
} from 'src/libs/daaHelpers'

// Mock DAA objects for testing
const createMockDaa = (overrides: Partial<DAAObject>): DAAObject => ({
  daaId: 1,
  createUserId: 1,
  createDate: '2026-01-01T00:00:00Z',
  updateUserId: 1,
  updateDate: '2026-01-01T00:00:00Z',
  initialDacId: 1,
  file: {
    fileStorageObjectId: 1,
    entityId: '1',
    fileName: 'test.pdf',
    category: 'dataAccessAgreement' as const,
    mediaType: 'application/pdf',
    createUserId: 1,
    createDate: 1704067200000,
  },
  dacs: [],
  ...overrides,
})

describe('daaHelpers', () => {
  describe('getOwnedDaas', () => {
    it('filters DAAs by initialDacId matching the current DAC', () => {
      const daas = [
        createMockDaa({ daaId: 1, initialDacId: 1 }),
        createMockDaa({ daaId: 2, initialDacId: 2 }),
        createMockDaa({ daaId: 3, initialDacId: 1 }),
      ]

      const ownedByDac1 = getOwnedDaas(daas, 1)
      expect(ownedByDac1).to.have.lengthOf(2)
      expect(ownedByDac1.map(d => d.daaId)).to.deep.equal([1, 3])
    })

    it('returns empty array when no DAAs are owned by the DAC', () => {
      const daas = [
        createMockDaa({ daaId: 1, initialDacId: 2 }),
        createMockDaa({ daaId: 2, initialDacId: 3 }),
      ]

      const ownedByDac1 = getOwnedDaas(daas, 1)
      expect(ownedByDac1).to.have.lengthOf(0)
    })

    it('returns empty array for empty input', () => {
      const ownedByDac1 = getOwnedDaas([], 1)
      expect(ownedByDac1).to.have.lengthOf(0)
    })
  })

  describe('getSharedDaas', () => {
    it('filters DAAs where initialDacId differs from the current DAC', () => {
      const daas = [
        createMockDaa({ daaId: 1, initialDacId: 1 }),
        createMockDaa({ daaId: 2, initialDacId: 2 }),
        createMockDaa({ daaId: 3, initialDacId: 3 }),
      ]

      const sharedWithDac1 = getSharedDaas(daas, 1)
      expect(sharedWithDac1).to.have.lengthOf(2)
      expect(sharedWithDac1.map(d => d.daaId)).to.deep.equal([2, 3])
    })

    it('returns empty array when no DAAs are shared with the DAC', () => {
      const daas = [
        createMockDaa({ daaId: 1, initialDacId: 1 }),
        createMockDaa({ daaId: 2, initialDacId: 1 }),
      ]

      const sharedWithDac1 = getSharedDaas(daas, 1)
      expect(sharedWithDac1).to.have.lengthOf(0)
    })

    it('returns empty array for empty input', () => {
      const sharedWithDac1 = getSharedDaas([], 1)
      expect(sharedWithDac1).to.have.lengthOf(0)
    })
  })

  describe('sortDaasByCreationDate', () => {
    it('sorts DAAs by creation date in ascending order', () => {
      const daas = [
        createMockDaa({ daaId: 1, createDate: '2026-03-01T00:00:00Z' }),
        createMockDaa({ daaId: 2, createDate: '2026-01-01T00:00:00Z' }),
        createMockDaa({ daaId: 3, createDate: '2026-02-01T00:00:00Z' }),
      ]

      const sorted = sortDaasByCreationDate(daas)
      expect(sorted.map(d => d.daaId)).to.deep.equal([2, 3, 1])
    })

    it('does not modify the original array', () => {
      const daas = [
        createMockDaa({ daaId: 1, createDate: '2026-03-01T00:00:00Z' }),
        createMockDaa({ daaId: 2, createDate: '2026-01-01T00:00:00Z' }),
      ]
      const original = [...daas]

      sortDaasByCreationDate(daas)
      expect(daas).to.deep.equal(original)
    })

    it('handles empty array', () => {
      const sorted = sortDaasByCreationDate([])
      expect(sorted).to.have.lengthOf(0)
    })

    it('handles single DAA', () => {
      const daas = [createMockDaa({ daaId: 1 })]
      const sorted = sortDaasByCreationDate(daas)
      expect(sorted).to.have.lengthOf(1)
      expect(sorted[0].daaId).to.equal(1)
    })
  })

  describe('getDefaultDaaForDac', () => {
    it('returns currently assigned DAA if it exists', () => {
      const assigned = createMockDaa({ daaId: 5, initialDacId: 2 })
      const daas = [
        createMockDaa({ daaId: 1, initialDacId: 1, createDate: '2026-01-01T00:00:00Z' }),
        createMockDaa({ daaId: 2, initialDacId: 2, createDate: '2026-02-01T00:00:00Z' }),
      ]

      const defaultDaa = getDefaultDaaForDac(1, daas, assigned)
      expect(defaultDaa?.daaId).to.equal(5)
    })

    it('returns first shared DAA if none assigned and shared DAAs exist', () => {
      const daas = [
        createMockDaa({ daaId: 1, initialDacId: 2, createDate: '2026-01-01T00:00:00Z' }),
        createMockDaa({ daaId: 2, initialDacId: 3, createDate: '2026-02-01T00:00:00Z' }),
        createMockDaa({ daaId: 3, initialDacId: 1, createDate: '2026-03-01T00:00:00Z' }),
      ]

      const defaultDaa = getDefaultDaaForDac(1, daas)
      expect(defaultDaa?.daaId).to.equal(1) // First by creation date
    })

    it('returns first owned DAA if no assigned and no shared DAAs', () => {
      const daas = [
        createMockDaa({ daaId: 1, initialDacId: 1, createDate: '2026-02-01T00:00:00Z' }),
        createMockDaa({ daaId: 2, initialDacId: 1, createDate: '2026-01-01T00:00:00Z' }),
      ]

      const defaultDaa = getDefaultDaaForDac(1, daas)
      expect(defaultDaa?.daaId).to.equal(2) // First by creation date
    })

    it('returns null if no DAAs available', () => {
      const defaultDaa = getDefaultDaaForDac(1, [])
      expect(defaultDaa).to.equal(null)
    })

    it('prefers shared DAAs over owned DAAs when none assigned', () => {
      const daas = [
        createMockDaa({ daaId: 1, initialDacId: 1, createDate: '2026-03-01T00:00:00Z' }),
        createMockDaa({ daaId: 2, initialDacId: 2, createDate: '2026-01-01T00:00:00Z' }),
      ]

      const defaultDaa = getDefaultDaaForDac(1, daas)
      expect(defaultDaa?.daaId).to.equal(2) // Shared DAA, earlier date
    })
  })

  describe('getDefaultTabForDac', () => {
    it('returns "owned" tab if selected DAA is owned by this DAC', () => {
      const selected = createMockDaa({ daaId: 1, initialDacId: 1 })
      const daas = [selected]

      const tab = getDefaultTabForDac(1, daas, selected)
      expect(tab).to.equal('owned')
    })

    it('returns "shared" tab if selected DAA is from another DAC', () => {
      const selected = createMockDaa({ daaId: 1, initialDacId: 2 })
      const daas = [selected]

      const tab = getDefaultTabForDac(1, daas, selected)
      expect(tab).to.equal('shared')
    })

    it('returns "shared" tab if no DAA assigned and shared DAAs exist', () => {
      const daas = [
        createMockDaa({ daaId: 1, initialDacId: 2 }),
      ]

      const tab = getDefaultTabForDac(1, daas)
      expect(tab).to.equal('shared')
    })

    it('returns "owned" tab if no DAA assigned and no shared DAAs', () => {
      const daas = [
        createMockDaa({ daaId: 1, initialDacId: 1 }),
      ]

      const tab = getDefaultTabForDac(1, daas)
      expect(tab).to.equal('owned')
    })

    it('returns "owned" tab as fallback when no DAAs at all', () => {
      const tab = getDefaultTabForDac(1, [])
      expect(tab).to.equal('owned')
    })
  })

  describe('isDaaOwnedByDac', () => {
    it('returns true if DAA is owned by the DAC', () => {
      const daa = createMockDaa({ initialDacId: 1 })
      expect(isDaaOwnedByDac(daa, 1)).to.equal(true)
    })

    it('returns false if DAA is not owned by the DAC', () => {
      const daa = createMockDaa({ initialDacId: 1 })
      expect(isDaaOwnedByDac(daa, 2)).to.equal(false)
    })
  })

  describe('daaHelpers - No DAAs Configured', () => {
    it('getOwnedDaas should return empty array when no DAAs are configured', () => {
      const ownedDaas = getOwnedDaas([], 1)
      expect(ownedDaas).to.have.lengthOf(0)
    })

    it('getSharedDaas should return empty array when no DAAs are configured', () => {
      const sharedDaas = getSharedDaas([], 1)
      expect(sharedDaas).to.have.lengthOf(0)
    })

    it('getDefaultDaaForDac should return null when no DAAs are configured', () => {
      const defaultDaa = getDefaultDaaForDac(1, [])
      expect(defaultDaa).to.equal(null)
    })

    it('getDefaultTabForDac should return "owned" tab when no DAAs are configured', () => {
      const defaultTab = getDefaultTabForDac(1, [])
      expect(defaultTab).to.equal('owned')
    })

    it('isDaaOwnedByDac should return correct ownership status', () => {
      const daa = createMockDaa({ initialDacId: 1 })
      expect(isDaaOwnedByDac(daa, 1)).to.equal(true)
      expect(isDaaOwnedByDac(daa, 2)).to.equal(false)
    })
  })
})
