import { describe, it, expect } from 'vitest'
import {
  clinicalTrialStatusSelectOptions,
  clinicalTrialPhaseSelectOptions,
  clinicalTrialInterventionSelectOptions,
} from 'src/utils/ClinicalTrialEnumUtils'
import {
  ClinicalTrialStatus,
  ClinicalTrialPhase,
  ClinicalTrialInterventionType,
} from 'src/types/model'

describe('ClinicalTrialEnumUtils', () => {
  describe('select options integrity', () => {
    const findKey = (opts: { key: string }[], key: string) => opts.some(o => o.key === key)

    it('status select options include UNKNOWN', () => {
      expect(findKey(clinicalTrialStatusSelectOptions, ClinicalTrialStatus.UNKNOWN)).toBe(true)
    })

    it('intervention select options include OTHER', () => {
      expect(findKey(clinicalTrialInterventionSelectOptions, ClinicalTrialInterventionType.OTHER)).toBe(true)
    })

    it('phase select options include fallback NA', () => {
      expect(findKey(clinicalTrialPhaseSelectOptions, ClinicalTrialPhase.NA)).toBe(true)
    })

    it('all option keys are unique per group', () => {
      const unique = (arr: string[]) => new Set(arr).size === arr.length
      expect(unique(clinicalTrialStatusSelectOptions.map(o => o.key))).toBe(true)
      expect(unique(clinicalTrialInterventionSelectOptions.map(o => o.key))).toBe(true)
      expect(unique(clinicalTrialPhaseSelectOptions.map(o => o.key))).toBe(true)
    })

    it('displayText matches expected legacy values sample', () => {
      const statusSample = clinicalTrialStatusSelectOptions.find(o => o.key === ClinicalTrialStatus.TERMINATED)
      expect(statusSample?.displayText).toBe('Terminated')
      const interventionSample = clinicalTrialInterventionSelectOptions.find(o => o.key === ClinicalTrialInterventionType.DRUG)
      expect(interventionSample?.displayText).toBe('Drug')
      const phaseSample = clinicalTrialPhaseSelectOptions.find(o => o.key === ClinicalTrialPhase.PHASE4)
      expect(phaseSample?.displayText).toBe('Phase 4')
    })
  })
})
