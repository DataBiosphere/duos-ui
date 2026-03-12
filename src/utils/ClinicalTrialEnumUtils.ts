import {
  ClinicalTrialStatus,
  ClinicalTrialPhase,
  ClinicalTrialInterventionType,
} from 'src/types/model'
import { SelectEntry } from 'src/components/forms/SelectOptionInterface'

/* Status Entries */
export const clinicalTrialStatusSelectOptions: SelectEntry[] = [
  { key: ClinicalTrialStatus.ACTIVE_NOT_RECRUITING, displayText: ClinicalTrialStatus.ACTIVE_NOT_RECRUITING },
  { key: ClinicalTrialStatus.COMPLETED, displayText: ClinicalTrialStatus.COMPLETED },
  { key: ClinicalTrialStatus.ENROLLING_BY_INVITATION, displayText: ClinicalTrialStatus.ENROLLING_BY_INVITATION },
  { key: ClinicalTrialStatus.NOT_YET_RECRUITING, displayText: ClinicalTrialStatus.NOT_YET_RECRUITING },
  { key: ClinicalTrialStatus.RECRUITING, displayText: ClinicalTrialStatus.RECRUITING },
  { key: ClinicalTrialStatus.SUSPENDED, displayText: ClinicalTrialStatus.SUSPENDED },
  { key: ClinicalTrialStatus.TERMINATED, displayText: ClinicalTrialStatus.TERMINATED },
  { key: ClinicalTrialStatus.WITHDRAWN, displayText: ClinicalTrialStatus.WITHDRAWN },
  { key: ClinicalTrialStatus.AVAILABLE, displayText: ClinicalTrialStatus.AVAILABLE },
  { key: ClinicalTrialStatus.NO_LONGER_AVAILABLE, displayText: ClinicalTrialStatus.NO_LONGER_AVAILABLE },
  { key: ClinicalTrialStatus.TEMPORARILY_NOT_AVAILABLE, displayText: ClinicalTrialStatus.TEMPORARILY_NOT_AVAILABLE },
  { key: ClinicalTrialStatus.APPROVED_FOR_MARKETING, displayText: ClinicalTrialStatus.APPROVED_FOR_MARKETING },
  { key: ClinicalTrialStatus.WITHHELD, displayText: ClinicalTrialStatus.WITHHELD },
  { key: ClinicalTrialStatus.UNKNOWN, displayText: ClinicalTrialStatus.UNKNOWN },
]

/* Intervention Entries */
export const clinicalTrialInterventionSelectOptions: SelectEntry[] = [
  { key: ClinicalTrialInterventionType.BEHAVIORAL, displayText: ClinicalTrialInterventionType.BEHAVIORAL },
  { key: ClinicalTrialInterventionType.BIOLOGICAL, displayText: ClinicalTrialInterventionType.BIOLOGICAL },
  { key: ClinicalTrialInterventionType.COMBINATION_PRODUCT, displayText: ClinicalTrialInterventionType.COMBINATION_PRODUCT },
  { key: ClinicalTrialInterventionType.DEVICE, displayText: ClinicalTrialInterventionType.DEVICE },
  { key: ClinicalTrialInterventionType.DIAGNOSTIC_TEST, displayText: ClinicalTrialInterventionType.DIAGNOSTIC_TEST },
  { key: ClinicalTrialInterventionType.DIETARY_SUPPLEMENT, displayText: ClinicalTrialInterventionType.DIETARY_SUPPLEMENT },
  { key: ClinicalTrialInterventionType.DRUG, displayText: ClinicalTrialInterventionType.DRUG },
  { key: ClinicalTrialInterventionType.GENETIC, displayText: ClinicalTrialInterventionType.GENETIC },
  { key: ClinicalTrialInterventionType.PROCEDURE, displayText: ClinicalTrialInterventionType.PROCEDURE },
  { key: ClinicalTrialInterventionType.RADIATION, displayText: ClinicalTrialInterventionType.RADIATION },
  { key: ClinicalTrialInterventionType.OTHER, displayText: ClinicalTrialInterventionType.OTHER }, // fallback
]

export const clinicalTrialPhaseSelectOptions: SelectEntry[] = [
  { key: ClinicalTrialPhase.EARLY_PHASE1, displayText: ClinicalTrialPhase.EARLY_PHASE1 },
  { key: ClinicalTrialPhase.PHASE1, displayText: ClinicalTrialPhase.PHASE1 },
  { key: ClinicalTrialPhase.PHASE2, displayText: ClinicalTrialPhase.PHASE2 },
  { key: ClinicalTrialPhase.PHASE3, displayText: ClinicalTrialPhase.PHASE3 },
  { key: ClinicalTrialPhase.PHASE4, displayText: ClinicalTrialPhase.PHASE4 },
  { key: ClinicalTrialPhase.NA, displayText: ClinicalTrialPhase.NA }, // fallback
]
