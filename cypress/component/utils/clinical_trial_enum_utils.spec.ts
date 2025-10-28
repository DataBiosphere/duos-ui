import {
  parseLegacyStatus,
  parseLegacyPhase,
  parseLegacyInterventionType,
  statusToDisplay,
  phaseToDisplay,
  interventionTypeToDisplay,
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
  describe('parseLegacyStatus', () => {
    it('parses legacy display values', () => {
      expect(parseLegacyStatus('Active, not recruiting')).to.eq(ClinicalTrialStatus.ACTIVE_NOT_RECRUITING)
      expect(parseLegacyStatus('active, not Recruiting')).to.eq(ClinicalTrialStatus.ACTIVE_NOT_RECRUITING)
      expect(parseLegacyStatus('Completed')).to.eq(ClinicalTrialStatus.COMPLETED)
      expect(parseLegacyStatus('completed')).to.eq(ClinicalTrialStatus.COMPLETED)
    })

    it('returns fallback UNKNOWN for invalid input', () => {
      expect(parseLegacyStatus('Invalid Status')).to.eq(ClinicalTrialStatus.UNKNOWN)
      expect(parseLegacyStatus(undefined)).to.eq(ClinicalTrialStatus.UNKNOWN)
      expect(parseLegacyStatus(null)).to.eq(ClinicalTrialStatus.UNKNOWN)
    })
  })

  describe('parseLegacyInterventionType', () => {
    it('parses legacy intervention types case-insensitively', () => {
      expect(parseLegacyInterventionType('Dietary supplement')).to.eq(ClinicalTrialInterventionType.DIETARY_SUPPLEMENT)
      expect(parseLegacyInterventionType('dietary Supplement')).to.eq(ClinicalTrialInterventionType.DIETARY_SUPPLEMENT)
      expect(parseLegacyInterventionType('Device')).to.eq(ClinicalTrialInterventionType.DEVICE)
      expect(parseLegacyInterventionType('device')).to.eq(ClinicalTrialInterventionType.DEVICE)
    })

    it('falls back to OTHER for unknown values', () => {
      expect(parseLegacyInterventionType('UnknownType')).to.eq(ClinicalTrialInterventionType.OTHER)
    })
  })

  describe('parseLegacyPhase', () => {
    it('parses legacy phase values', () => {
      expect(parseLegacyPhase('Phase 2')).to.eq(ClinicalTrialPhase.PHASE2)
      expect(parseLegacyPhase('phase 2')).to.eq(ClinicalTrialPhase.PHASE2)
      expect(parseLegacyPhase('Early Phase 1')).to.eq(ClinicalTrialPhase.EARLY_PHASE1)
    })

    it('falls back to NA for invalid values', () => {
      expect(parseLegacyPhase('Phase X')).to.eq(ClinicalTrialPhase.NA)
    })
  })

  describe('display mapping', () => {
    it('maps status enum to display text', () => {
      expect(statusToDisplay(ClinicalTrialStatus.RECRUITING)).to.eq('Recruiting')
      expect(statusToDisplay(ClinicalTrialStatus.APPROVED_FOR_MARKETING)).to.eq('Approved for marketing')
    })

    it('maps intervention type enum to display text', () => {
      expect(interventionTypeToDisplay(ClinicalTrialInterventionType.BEHAVIORAL)).to.eq('Behavioral')
      expect(interventionTypeToDisplay(ClinicalTrialInterventionType.RADIATION)).to.eq('Radiation')
    })

    it('maps phase enum to display text', () => {
      expect(phaseToDisplay(ClinicalTrialPhase.PHASE3)).to.eq('Phase 3')
      expect(phaseToDisplay(ClinicalTrialPhase.EARLY_PHASE1)).to.eq('Early Phase 1')
    })
  })

  describe('select options integrity', () => {
    const findKey = (opts: { key: string }[], key: string) => opts.some(o => o.key === key)

    it('status select options exclude fallback UNKNOWN', () => {
      expect(findKey(clinicalTrialStatusSelectOptions, ClinicalTrialStatus.UNKNOWN)).to.equal(false)
    })

    it('intervention select options exclude fallback OTHER', () => {
      expect(findKey(clinicalTrialInterventionSelectOptions, ClinicalTrialInterventionType.OTHER)).to.equal(false)
    })

    it('phase select options exclude fallback NA', () => {
      expect(findKey(clinicalTrialPhaseSelectOptions, ClinicalTrialPhase.NA)).to.equal(false)
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

  describe('round-trip parsing and display', () => {
    it('status round-trips legacy display -> enum -> display', () => {
      const legacy = 'Active, not recruiting'
      const enumVal = parseLegacyStatus(legacy)
      expect(statusToDisplay(enumVal)).to.eq(legacy)
    })

    it('intervention type round-trips', () => {
      const legacy = 'Combination product'
      const enumVal = parseLegacyInterventionType(legacy)
      expect(interventionTypeToDisplay(enumVal)).to.eq(legacy)
    })

    it('phase round-trips', () => {
      const legacy = 'Phase 2'
      const enumVal = parseLegacyPhase(legacy)
      expect(phaseToDisplay(enumVal)).to.eq(legacy)
    })
  })
})
