/**
 * The dataset card that the dataset shelves render (DT-4355, S3.3; design review D18). The fields
 * come from `datasetCardEntries` in D18 order, and a missing value is left out. A dataset whose
 * "New in DUOS" date is in the last 30 days (UTC) gets a badge.
 *
 * The primary action depends on access management:
 * - controlled: "Request access" opens the DUOS dataset page, where "Apply for Access" starts the
 *   current request path. It is a handoff, so `ShowcaseLink` labels it for a visitor who is not
 *   signed in and shows it as text in a production-data preview (S3.2).
 * - open or external: a link to the provider's page. The "Provider site" field then shows the
 *   host as text, so the card has one provider link, not two.
 * - unknown: no action.
 *
 * The projection has no file type, so the action can't tell a direct download from a provider
 * page; it always says it opens the provider page.
 */
import React, { useContext } from 'react'
import { datasetPath } from 'src/components/showcase/handoffs'
import { Card, type HeadingLevel } from 'src/components/showcase/primitives/Card'
import type { ShowcaseAction } from 'src/components/showcase/primitives/safeHref'
import { ShowcaseClockContext } from 'src/components/showcase/showcaseTemplateContract'
import { datasetCardEntries } from 'src/showcases/datasetCardLabels'
import { isNewInDuos } from 'src/showcases/dateWindow'
import type { DatasetSummary } from 'src/types/showcase'

/** Provisional copy (S3.3). */
export const NEW_IN_DUOS_LABEL = 'New in DUOS'
export const REQUEST_ACCESS_LABEL = 'Request access'
export const OPEN_PROVIDER_LABEL = 'Open provider site'

const primaryAction = (summary: DatasetSummary, providerHref: string | undefined): ShowcaseAction | undefined => {
  if (summary.accessManagement === 'controlled') {
    const href = datasetPath(summary.identifier)
    return href === undefined ? undefined : { label: REQUEST_ACCESS_LABEL, href }
  }
  return providerHref === undefined ? undefined : { label: OPEN_PROVIDER_LABEL, href: providerHref }
}

export interface DatasetCardProps {
  summary: DatasetSummary
  headingLevel?: HeadingLevel
}

export const DatasetCard = ({ summary, headingLevel = 3 }: DatasetCardProps) => {
  const clock = useContext(ShowcaseClockContext)
  const entries = datasetCardEntries(summary)
  const providerHref = entries.find(entry => entry.field === 'accessUrl')?.href
  const action = primaryAction(summary, providerHref)
  // The provider link is the action; the field keeps the host as text.
  const metadata = entries.map(({ label, value }) => ({ label, value }))

  return (
    <Card
      title={summary.title}
      headingLevel={headingLevel}
      badges={isNewInDuos(summary.availableDate, clock) ? [NEW_IN_DUOS_LABEL] : []}
      metadata={metadata}
      actions={action === undefined ? [] : [action]}
    />
  )
}
