import { getAccessManagementLabel } from 'src/components/data_library/accessManagementDisplay'
import type { DatasetSummary } from 'src/types/showcase'

export type DatasetCardField = Exclude<keyof DatasetSummary, 'title'>

type FieldLabel = { label: string, display: (summary: DatasetSummary) => string | null }

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })

const nonBlank = (value: string | null): string | null => (value?.trim() ? value.trim() : null)

/** Card fields in display order, each with a `display` that returns `null` for a missing or unknown
 * value, so the card leaves it out. The title is the card heading and always present. */
export const DATASET_CARD_LABELS = {
  identifier: { label: 'DUOS ID', display: s => s.identifier },
  accessManagement: { label: 'Access', display: s => (s.accessManagement === null ? null : getAccessManagementLabel(s.accessManagement)) },
  dacName: { label: 'DAC', display: s => nonBlank(s.dacName) },
  consentCodes: { label: 'Data use', display: s => nonBlank(s.consentCodes.map(code => code.trim()).filter(Boolean).join(', ')) },
  // Registration requires a positive count, so zero means the count was never recorded.
  participantCount: { label: 'Participants', display: s => (s.participantCount !== null && s.participantCount > 0 ? s.participantCount.toLocaleString('en-US') : null) },
  availableDate: { label: 'Available in DUOS', display: s => (s.availableDate === null ? null : dateFormat.format(new Date(s.availableDate))) },
  // Controlled datasets use the DUOS request handoff, never a provider link.
  accessUrl: { label: 'Provider site', display: s => (s.accessManagement === 'open' || s.accessManagement === 'external' ? s.accessUrl : null) },
} as const satisfies Record<DatasetCardField, FieldLabel>

export type DatasetCardEntry = { field: DatasetCardField, label: string, value: string }

/** The card's labelled fields that have a value, in display order. */
export const datasetCardEntries = (summary: DatasetSummary): DatasetCardEntry[] =>
  (Object.entries(DATASET_CARD_LABELS) as [DatasetCardField, FieldLabel][]).flatMap(([field, { label, display }]) => {
    const value = display(summary)
    return value === null ? [] : [{ field, label, value }]
  })
