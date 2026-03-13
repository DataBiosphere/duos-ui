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
      expect(findKey(clinicalTrialStatusSelectOptions, ClinicalTrialStatus.UNKNOWN)).to.equal(true)
    })

    it('intervention select options include OTHER', () => {
      expect(findKey(clinicalTrialInterventionSelectOptions, ClinicalTrialInterventionType.OTHER)).to.equal(true)
    })

    it('phase select options include fallback NA', () => {
      expect(findKey(clinicalTrialPhaseSelectOptions, ClinicalTrialPhase.NA)).to.equal(true)
    })

    it('all option keys are unique per group', () => {
      const unique = (arr: string[]) => new Set(arr).size === arr.length
      expect(unique(clinicalTrialStatusSelectOptions.map(o => o.key))).to.equal(true)
      expect(unique(clinicalTrialInterventionSelectOptions.map(o => o.key))).to.equal(true)
      expect(unique(clinicalTrialPhaseSelectOptions.map(o => o.key))).to.equal(true)
    })

    it('displayText matches expected legacy values sample', () => {
      const statusSample = clinicalTrialStatusSelectOptions.find(o => o.key === ClinicalTrialStatus.TERMINATED)
      expect(statusSample?.displayText).to.eq('Terminated')
      const interventionSample = clinicalTrialInterventionSelectOptions.find(o => o.key === ClinicalTrialInterventionType.DRUG)
      expect(interventionSample?.displayText).to.eq('Drug')
      const phaseSample = clinicalTrialPhaseSelectOptions.find(o => o.key === ClinicalTrialPhase.PHASE4)
      expect(phaseSample?.displayText).to.eq('Phase 4')
    })
  })
})
