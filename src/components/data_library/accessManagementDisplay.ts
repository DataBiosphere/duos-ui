import { AccessManagement } from 'src/types/library'

type ChipColor = 'primary' | 'success' | 'secondary' | 'default'

/** Shared by the Datasets grid column and the Studies card pills, so the two cannot drift apart. */
export const getAccessManagementLabel = (value: string): string => {
  switch (value) {
    case AccessManagement.OPEN: return 'Open Access'
    case AccessManagement.CONTROLLED: return 'via DUOS'
    case AccessManagement.EXTERNAL: return 'External to DUOS'
    default: return value
  }
}

export const getAccessManagementColor = (value: string): ChipColor => {
  switch (value) {
    case AccessManagement.CONTROLLED: return 'primary'
    case AccessManagement.OPEN: return 'success'
    case AccessManagement.EXTERNAL: return 'secondary'
    default: return 'default'
  }
}
