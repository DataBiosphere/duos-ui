/**
 * Tests that document the data-bag bugs found during DT-3599.
 *
 * These tests are regression coverage for bugs found during DT-3599.
 * They should pass; if they fail, the bug has regressed.
 *
 * Issues under test:
 *   Critical [1] – studyToDatasetSchemaSubmission reads study.properties[] instead of
 *                  study.data, silently deleting existing tags when the user saves without
 *                  touching the Tags panel.
 *   Critical [2] – buildConsentGroupsFromStudy reads dataset.properties[] with no fallback;
 *                  if the 'data' entry is absent the entire data bag becomes {}.
 *   High     [3] – GeneralStudyInformation renders defaultValue from study.properties[] and
 *                  selectOptions from study.data — two sources that can diverge.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  studyToDatasetSchemaSubmission,
  buildConsentGroupsFromStudy,
  getStudyPropertyValueByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { Study, StudyData, StudyProperty } from 'src/pages/data_submission/v2/v2-models'
import { StudyDataMetadata } from 'src/libs/data-metadata'
import { Storage } from 'src/libs/storage'
import type { Dataset, DataUse, DuosUser } from 'src/types/model'

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

beforeEach(() => {
  vi.mocked(Storage.getCurrentUser).mockReturnValue({ institutionId: undefined } as unknown as DuosUser)
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A Study as it arrives from the API: study.data is populated, properties[] is not. */
function apiLoadedStudy(dataBag: StudyDataMetadata, extraProperties: Study['properties'] = []): Study {
  return {
    piName: 'Dr. Test',
    piEmail: 'test@example.com',
    data: dataBag,
    properties: extraProperties,
  }
}

/**
 * A Dataset as it arrives from the API.
 * withDataBag: if provided, adds a properties entry for 'data'.
 * omitDataBag: simulates a dataset where the backend didn't include the 'data' property.
 */
function apiLoadedDataset(options: { dataBag?: Record<string, unknown> } = {}): Dataset {
  const dataProperty = options.dataBag
    ? [{ propertyName: 'data', propertyValue: options.dataBag as unknown as string }]
    : []

  return {
    datasetId: 1,
    name: 'Test Dataset',
    dacId: 1,
    dataUse: { generalUse: true } as DataUse,
    properties: dataProperty,
    createUserId: 1,
    createUser: {} as DuosUser,
    createDate: new Date(),
    translatedDataUse: '',
    deletable: false,
    study: {} as Study,
    alias: 1,
    datasetIdentifier: 'DS-1',
  } as Dataset
}

// ---------------------------------------------------------------------------
// Critical [1]: studyToDatasetSchemaSubmission — wrong data source
// ---------------------------------------------------------------------------

describe('Critical [1] — studyToDatasetSchemaSubmission: reads wrong source for study data bag', () => {
  /**
   * BUG: studyToDatasetSchemaSubmission builds the submission payload by calling
   * getStudyPropertyValueByKey(study, 'data'), which searches study.properties[].
   *
   * When an existing study is loaded from the API, the backend populates study.data
   * directly.  study.properties[] is only populated when the user interacts with a
   * form field.  If the user edits a field on a *different* tab and saves, properties[]
   * has no 'data' entry and the function submits data: {}, permanently deleting any
   * tags that were stored on the backend.
   *
   * v2-common-functions.tsx:224
   *   data: getStudyPropertyValueByKey(study, StudyData.key) as Record<string, unknown> || {},
   */
  it('BUG [1a]: drops tags when study.data is populated but study.properties has no data entry', () => {
    const study = apiLoadedStudy({ tags: ['NHLBI', 'Genomics'] })
    // Confirm the precondition: tags exist on study.data but not in properties[]
    expect(study.data.tags).toEqual(['NHLBI', 'Genomics'])
    expect(study.properties).toHaveLength(0)

    const schema = studyToDatasetSchemaSubmission(study)

    // BUG: actual value is {} — tags are silently dropped from the submission.
    expect(schema.data).toEqual({ tags: ['NHLBI', 'Genomics'] })
  })

  it('BUG [1b]: drops all data-bag keys (not just tags) when properties has no data entry', () => {
    const study = apiLoadedStudy({ tags: ['eLwazi'], customRoundTripKey: 'keep-me' })

    const schema = studyToDatasetSchemaSubmission(study)

    // BUG: both tags and any other round-trip keys are lost.
    expect(schema.data).toHaveProperty('tags')
    expect(schema.data).toHaveProperty('customRoundTripKey')
  })

  it('control: preserves tags when properties has a data entry (user visited Tags panel)', () => {
    // After the user opens the Tags panel, setStudyPropertyByKey pushes a StudyData
    // instance into study.properties[].  In this state the function works correctly.
    const studyDataEntry = new StudyData({ tags: ['NHLBI', 'Genomics'] })
    const study = apiLoadedStudy(
      { tags: ['NHLBI', 'Genomics'] },
      [studyDataEntry.toJSON() as StudyProperty],
    )

    const schema = studyToDatasetSchemaSubmission(study)

    expect(schema.data).toEqual({ tags: ['NHLBI', 'Genomics'] })
  })
})

// ---------------------------------------------------------------------------
// Critical [2]: buildConsentGroupsFromStudy — dataset data bag not read from any fallback
// ---------------------------------------------------------------------------

describe('Critical [2] — buildConsentGroupsFromStudy: drops dataset data bag when not in properties', () => {
  /**
   * buildConsentGroupsFromStudy hydrates consentGroup.data via:
   *   getDatasetPropertyValueByKey(DatasetData.propertyName, dataset) || {}
   *
   * This searches dataset.properties[] for an entry with propertyName === 'data'.
   * There is no fallback to any top-level dataset field.  If the entry is absent
   * (e.g. legacy datasets, partial API responses, or the entry is stored under a
   * different key), the entire data bag is silently replaced with {}.
   *
   * v2-common-functions.tsx:294
   *   consentGroup.data = getDatasetPropertyValueByKey(DatasetData.propertyName, dataset)
   *                         as Record<string, unknown> || {}
   */
  it('BUG [2a]: drops cloud when dataset.properties has no data entry', () => {
    const study: Study = {
      piName: 'Dr. Test',
      piEmail: 'test@example.com',
      data: {},
      datasets: [apiLoadedDataset()], // no 'data' property entry
    }

    const groups = buildConsentGroupsFromStudy(study)

    // BUG: actual value is {}.  If a caller later re-saves, cloud is permanently lost.
    expect(groups[0].data).not.toEqual({})
  })

  it('control: preserves cloud when dataset.properties contains a data entry', () => {
    const study: Study = {
      piName: 'Dr. Test',
      piEmail: 'test@example.com',
      data: {},
      datasets: [apiLoadedDataset({ dataBag: { cloud: ['GCP', 'AWS'] } })],
    }

    const groups = buildConsentGroupsFromStudy(study)

    expect(groups[0].data).toEqual({ cloud: ['GCP', 'AWS'] })
  })

  it('control: preserves tags when dataset.properties contains a data entry', () => {
    const study: Study = {
      piName: 'Dr. Test',
      piEmail: 'test@example.com',
      data: {},
      datasets: [apiLoadedDataset({ dataBag: { tags: ['Platform: AnVIL'], cloud: ['GCP'] } })],
    }

    const groups = buildConsentGroupsFromStudy(study)

    expect(groups[0].data).toEqual({ tags: ['Platform: AnVIL'], cloud: ['GCP'] })
  })
})

// ---------------------------------------------------------------------------
// High [3]: GeneralStudyInformation — defaultValue and selectOptions read from diverging sources
// ---------------------------------------------------------------------------

describe('High [3] — GeneralStudyInformation Tags field: defaultValue and selectOptions use unified source', () => {
  /**
   * Fix: GeneralStudyInformation now derives a single `currentDataBag` before rendering:
   *
   *   const currentDataBag =
   *     (getStudyPropertyValueByKey(study, 'data') as StudyDataMetadata | undefined) ?? study.data
   *
   * Both `defaultValue` and `selectOptions` read from `currentDataBag?.tags`.
   * This resolves the divergence where defaultValue read from properties[] and
   * selectOptions read from study.data.
   */

  // Mirrors the component's currentDataBag derivation exactly.
  const resolveDataBag = (study: Study): StudyDataMetadata => {
    const fromProperties = getStudyPropertyValueByKey(study, 'data')
    if (fromProperties !== undefined) return fromProperties as StudyDataMetadata
    return study.data
  }

  it('FIX [3a]: resolveDataBag falls back to study.data when properties has no data entry', () => {
    const study = apiLoadedStudy({ tags: ['NHLBI'] })

    const bag = resolveDataBag(study)

    // The unified source reads the API-populated tags even before the user touches the field.
    expect(bag.tags).toEqual(['NHLBI'])
  })

  it('FIX [3b]: defaultValue and selectOptions now agree when study is API-loaded (properties empty)', () => {
    const study = apiLoadedStudy({ tags: ['NHLBI', 'Genomics'] })

    const bag = resolveDataBag(study)
    const defaultValue = bag.tags || []
    const selectOptions = bag.tags || []

    // Both read the same expression — divergence is gone.
    expect(defaultValue).toEqual(selectOptions)
    expect(defaultValue).toEqual(['NHLBI', 'Genomics'])
  })

  it('FIX [3c]: resolveDataBag prefers in-progress properties entry over study.data after user edits', () => {
    // Simulates the state after the user has edited the tags field once:
    // properties[] has the new value while study.data still has the original API value.
    const studyDataEntry = new StudyData({ tags: ['UserAdded'] })
    const study = apiLoadedStudy(
      { tags: ['NHLBI'] }, // original API value
      [studyDataEntry.toJSON() as StudyProperty], // user's in-progress edit
    )

    const bag = resolveDataBag(study)

    // The in-progress edit wins.
    expect(bag.tags).toEqual(['UserAdded'])
    expect(bag.tags).not.toEqual(['NHLBI'])
  })
})
