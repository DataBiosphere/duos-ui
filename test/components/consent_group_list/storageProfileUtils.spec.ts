import { describe, it, expect } from 'vitest'
import { fileTypesFromProfiles, storageProfileErrors, storageProfilesFor } from 'src/components/consent_group_list/storageProfileUtils'
import { FileType } from 'src/pages/data_submission/consent_group/consentGroupUtils'

describe('storage profile helpers', () => {
  it('shows a dataset saved before profiles as one profile per file type', () => {
    const fileTypes = [{ fileType: 'Genome' }, { fileType: 'Exome' }] as unknown as FileType[]
    expect(storageProfilesFor(undefined, fileTypes)).toEqual([{ fileType: 'Genome' }, { fileType: 'Exome' }])
  })

  it('always offers at least one row', () => {
    expect(storageProfilesFor(undefined, undefined)).toEqual([{}])
    expect(storageProfilesFor([], [])).toEqual([{}])
  })

  it('prefers stored profiles over file types', () => {
    expect(storageProfilesFor([{ fileType: 'Survey', region: 'us' }], [{ fileType: 'Genome' } as unknown as FileType])).toEqual([{ fileType: 'Survey', region: 'us' }])
  })

  it('derives each file type once, in first-use order, skipping profiles without one', () => {
    expect(fileTypesFromProfiles([{ fileType: 'Exome' }, {}, { fileType: 'Genome' }, { fileType: 'Exome' }]))
      .toEqual([{ fileType: 'Exome' }, { fileType: 'Genome' }])
  })

  it('flags negative counts and sizes by row', () => {
    expect(storageProfileErrors([{ fileCount: 3 }, { fileCount: -1, aggregateFileSizeBytes: -5 }])).toEqual({
      1: {
        fileCount: { valid: false, failed: ['greaterThanZero'] },
        aggregateFileSizeBytes: { valid: false, failed: ['greaterThanZero'] },
      },
    })
  })
})
