import { getAccessManagementLabel } from 'src/components/data_library/accessManagementDisplay'
import type { DatasetSummary } from 'src/types/showcase'

export type DatasetCardField = Exclude<keyof DatasetSummary, 'title'>

type FieldLabel = { label: string, display: (summary: DatasetSummary) => string | null }

/** Reads `availableDate` as the UTC calendar date it is, whatever the reader's time zone. */
export const availableDateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })

const isProviderManaged = (s: DatasetSummary) => s.accessManagement === 'open' || s.accessManagement === 'external'

/** Card fields in display order, each with a `display` that returns `null` for a missing or unknown
 * value, so the card leaves it out. The title is the card heading and always present. */
export const DATASET_CARD_LABELS = {
  identifier: { label: 'DUOS ID', display: s => s.identifier },
  accessManagement: { label: 'Access', display: s => (s.accessManagement === null ? null : getAccessManagementLabel(s.accessManagement)) },
  // A DUOS DAC reviews only datasets that are not open or external.
  dacName: { label: 'DAC', display: s => (isProviderManaged(s) ? null : s.dacName?.trim() || null) },
  consentCodes: {
    label: 'Data use',
    display: (s) => {
      const codes = s.consentCodes.map(code => code.trim()).filter(Boolean)
      return codes.length ? codes.join(', ') : null
    },
  },
  // Registration requires a positive count, so zero means the count was never recorded.
  participantCount: { label: 'Participants', display: s => (s.participantCount !== null && s.participantCount > 0 ? s.participantCount.toLocaleString('en-US') : null) },
  availableDate: { label: 'Available in DUOS', display: s => (s.availableDate === null ? null : availableDateFormat.format(new Date(s.availableDate))) },
  // Controlled datasets use the DUOS request handoff, and provider links must be https.
  accessUrl: { label: 'Provider site', display: s => (isProviderManaged(s) && s.accessUrl !== null && new URL(s.accessUrl).protocol === 'https:' ? s.accessUrl : null) },
} as const satisfies Record<DatasetCardField, FieldLabel>

/** `href` is set on the provider link, whose `value` is the provider's host. */
export type DatasetCardEntry = { field: DatasetCardField, label: string, value: string, href?: string }

/** The card's labelled fields that have a value, in display order. */
export const datasetCardEntries = (summary: DatasetSummary): DatasetCardEntry[] =>
  (Object.entries(DATASET_CARD_LABELS) as [DatasetCardField, FieldLabel][]).flatMap(([field, { label, display }]): DatasetCardEntry[] => {
    const value = display(summary)
    if (value === null) return []
    return field === 'accessUrl' ? [{ field, label, value: new URL(value).host, href: value }] : [{ field, label, value }]
  })
