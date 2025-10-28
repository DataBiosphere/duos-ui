import {
  ClinicalTrialStatus,
  ClinicalTrialPhase,
  ClinicalTrialInterventionType,
} from 'src/types/model'
import { SelectEntry } from 'src/components/forms/SelectOptionInterface'

export interface LegacyPair<E extends string> {
  value: E
  legacyValue: string
}

const normalize = (s: string) => s.trim().toLowerCase()

const buildAdapter = <E extends string>(pairs: LegacyPair<E>[], fallback: E) => {
  const legacyToEnum: Record<string, E> = {}
  const enumToLegacy: Record<E, string> = {} as Record<E, string>

  for (const p of pairs) {
    enumToLegacy[p.value] = p.legacyValue
    legacyToEnum[normalize(p.legacyValue)] = p.value
    legacyToEnum[normalize(p.value)] = p.value
  }

  const parseLegacy = (legacy?: string | null): E =>
    legacy ? (legacyToEnum[normalize(legacy)] || fallback) : fallback

  const toDisplay = (value: E): string => enumToLegacy[value] || enumToLegacy[fallback]

  // Return select options (id/displayText) excluding fallback
  const selectOptions: SelectEntry[] = pairs
    .filter(p => p.value !== fallback)
    .map(p => ({ key: p.value, displayText: p.legacyValue }))

  return { parseLegacy, toDisplay, selectOptions }
}

/* Status */
const statusPairs: LegacyPair<ClinicalTrialStatus>[] = [
  { value: ClinicalTrialStatus.ACTIVE_NOT_RECRUITING, legacyValue: 'Active, not recruiting' },
  { value: ClinicalTrialStatus.COMPLETED, legacyValue: 'Completed' },
  { value: ClinicalTrialStatus.ENROLLING_BY_INVITATION, legacyValue: 'Enrolling by invitation' },
  { value: ClinicalTrialStatus.NOT_YET_RECRUITING, legacyValue: 'Not yet recruiting' },
  { value: ClinicalTrialStatus.RECRUITING, legacyValue: 'Recruiting' },
  { value: ClinicalTrialStatus.SUSPENDED, legacyValue: 'Suspended' },
  { value: ClinicalTrialStatus.TERMINATED, legacyValue: 'Terminated' },
  { value: ClinicalTrialStatus.WITHDRAWN, legacyValue: 'Withdrawn' },
  { value: ClinicalTrialStatus.AVAILABLE, legacyValue: 'Available' },
  { value: ClinicalTrialStatus.NO_LONGER_AVAILABLE, legacyValue: 'No longer available' },
  { value: ClinicalTrialStatus.TEMPORARILY_NOT_AVAILABLE, legacyValue: 'Temporarily not available' },
  { value: ClinicalTrialStatus.APPROVED_FOR_MARKETING, legacyValue: 'Approved for marketing' },
  { value: ClinicalTrialStatus.WITHHELD, legacyValue: 'Withheld' },
  { value: ClinicalTrialStatus.UNKNOWN, legacyValue: 'Unknown' }, // fallback
]
const statusAdapter = buildAdapter(statusPairs, ClinicalTrialStatus.UNKNOWN)
export const parseLegacyStatus = statusAdapter.parseLegacy
export const statusToDisplay = statusAdapter.toDisplay
export const clinicalTrialStatusSelectOptions = statusAdapter.selectOptions

/* Intervention Type */
const interventionPairs: LegacyPair<ClinicalTrialInterventionType>[] = [
  { value: ClinicalTrialInterventionType.BEHAVIORAL, legacyValue: 'Behavioral' },
  { value: ClinicalTrialInterventionType.BIOLOGICAL, legacyValue: 'Biological' },
  { value: ClinicalTrialInterventionType.COMBINATION_PRODUCT, legacyValue: 'Combination product' },
  { value: ClinicalTrialInterventionType.DEVICE, legacyValue: 'Device' },
  { value: ClinicalTrialInterventionType.DIAGNOSTIC_TEST, legacyValue: 'Diagnostic test' },
  { value: ClinicalTrialInterventionType.DIETARY_SUPPLEMENT, legacyValue: 'Dietary supplement' },
  { value: ClinicalTrialInterventionType.DRUG, legacyValue: 'Drug' },
  { value: ClinicalTrialInterventionType.GENETIC, legacyValue: 'Genetic' },
  { value: ClinicalTrialInterventionType.PROCEDURE, legacyValue: 'Procedure' },
  { value: ClinicalTrialInterventionType.RADIATION, legacyValue: 'Radiation' },
  { value: ClinicalTrialInterventionType.OTHER, legacyValue: 'Other' }, // fallback
]
const interventionAdapter = buildAdapter(interventionPairs, ClinicalTrialInterventionType.OTHER)
export const parseLegacyInterventionType = interventionAdapter.parseLegacy
export const interventionTypeToDisplay = interventionAdapter.toDisplay
export const clinicalTrialInterventionSelectOptions = interventionAdapter.selectOptions

/* Phase */
const phasePairs: LegacyPair<ClinicalTrialPhase>[] = [
  { value: ClinicalTrialPhase.EARLY_PHASE1, legacyValue: 'Early Phase 1' },
  { value: ClinicalTrialPhase.PHASE1, legacyValue: 'Phase 1' },
  { value: ClinicalTrialPhase.PHASE2, legacyValue: 'Phase 2' },
  { value: ClinicalTrialPhase.PHASE3, legacyValue: 'Phase 3' },
  { value: ClinicalTrialPhase.PHASE4, legacyValue: 'Phase 4' },
  { value: ClinicalTrialPhase.NA, legacyValue: 'Not Applicable' }, // fallback
]
const phaseAdapter = buildAdapter(phasePairs, ClinicalTrialPhase.NA)
export const parseLegacyPhase = phaseAdapter.parseLegacy
export const phaseToDisplay = phaseAdapter.toDisplay
export const clinicalTrialPhaseSelectOptions = phaseAdapter.selectOptions

/* Convenience lookups */
export const clinicalTrialEnumDisplay = {
  status: statusToDisplay,
  phase: phaseToDisplay,
  interventionType: interventionTypeToDisplay,
}
