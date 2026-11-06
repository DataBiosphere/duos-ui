/**
 * A dataset shelf section (DT-4355, S3.3): the cards that one catalog lookup returns, in the order
 * Consent gives them. `latest-data-releases` uses it now; `open-access-datasets` will too.
 *
 * - Loading (D11): the heading and a skeleton at card height, announced once as "Loading
 *   datasets". The skeleton is hidden from assistive technology.
 * - Failed (D12): the heading stays, with a message and "Try again" in place of the cards. Mock
 *   or cached data is never shown.
 * - Ready: one `DatasetCard` per dataset in the `Shelf` primitive, with "See all" when the config
 *   sets `seeAllUrl` (D4).
 * - Ready with no datasets: nothing renders.
 *
 * "Try again" moves focus to the heading first, so focus is not lost when the button goes away;
 * the heading keeps it while the shelf loads and when the cards arrive.
 *
 * The section's DOM id is on the root `div`, the target of `#<section key>` links. While the shelf
 * loads or is empty, the template gives it no sub-nav link and hides same-page links to it (D11).
 */
import React, { useContext, useEffect, useId, useRef } from 'react'
import { DatasetCard } from 'src/components/showcase/primitives/DatasetCard'
import { Shelf } from 'src/components/showcase/primitives/Shelf'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import type { SectionRendererProps } from 'src/components/showcase/sectionRegistry'
import { ShowcaseLookupsContext } from 'src/components/showcase/showcaseTemplateContract'
import type { DatasetSectionKey } from 'src/types/showcase'
import './DatasetShelf.css'

/** Provisional copy (S3.3; D11 and D12 wording from the contracts record). */
export const DATASETS_LOADING_TEXT = 'Loading datasets'
export const DATASETS_FAILED_TEXT = 'These datasets can\'t be loaded right now.'
export const TRY_AGAIN_LABEL = 'Try again'
export const SEE_ALL_LABEL = 'See all'

const SKELETON_CARDS = 3

const Heading = ({ id, title }: { id: string, title: string }) => (
  <h2 id={id} className="showcase-shelf__title" tabIndex={-1}>{title}</h2>
)

/** The loading and failed states share one frame, so the heading element, and its focus, stay. */
const Frame = ({ headingId, title, children }: { headingId: string, title: string, children: React.ReactNode }) => (
  <section className="showcase-shelf" aria-labelledby={headingId}>
    <div className="showcase-shelf__header"><Heading id={headingId} title={title} /></div>
    {children}
  </section>
)

const Skeleton = () => (
  <>
    <p role="status" className="showcase-visually-hidden">{DATASETS_LOADING_TEXT}</p>
    <div className="showcase-dataset-shelf__skeleton" aria-hidden="true">
      {Array.from({ length: SKELETON_CARDS }, (_, i) => <div key={i} className="showcase-dataset-shelf__skeleton-card" />)}
    </div>
  </>
)

const Failed = ({ onRetry }: { onRetry: () => void }) => (
  <div className="showcase-dataset-shelf__failed">
    <p>{DATASETS_FAILED_TEXT}</p>
    <button type="button" className="showcase-dataset-shelf__retry" onClick={onRetry}>{TRY_AGAIN_LABEL}</button>
  </div>
)

export const DatasetShelf = <K extends DatasetSectionKey>({ sectionKey, section, id, title = '' }: SectionRendererProps<K>) => {
  const state = useContext(ShowcaseLookupsContext).datasets[sectionKey]
  const headingId = useId()
  const retried = useRef(false)

  // After "Try again", the ready shelf renders a new heading element; move focus to it too.
  useEffect(() => {
    if (retried.current && state?.status === 'ready') {
      retried.current = false
      document.getElementById(headingId)?.focus()
    }
  }, [state?.status, headingId])

  if (state === undefined || (state.status === 'ready' && state.data.length === 0)) return null

  const retry = () => {
    retried.current = true
    document.getElementById(headingId)?.focus()
    state.retry()
  }

  let body: React.ReactNode
  if (state.status === 'ready') {
    const seeAll = section.seeAllUrl === undefined
      ? undefined
      : <ShowcaseLink href={section.seeAllUrl} aria-describedby={headingId}>{SEE_ALL_LABEL}</ShowcaseLink>
    body = (
      <Shelf title={title} headingId={headingId} heading={<Heading id={headingId} title={title} />} actions={seeAll}>
        {state.data.map(summary => <DatasetCard key={summary.identifier} summary={summary} />)}
      </Shelf>
    )
  }
  else {
    body = (
      <Frame headingId={headingId} title={title}>
        {state.status === 'loading' ? <Skeleton /> : <Failed onRetry={retry} />}
      </Frame>
    )
  }

  return <div id={id} className="showcase-dataset-shelf">{body}</div>
}
