/**
 * A dataset shelf section (DT-4355, S3.3): the cards that one catalog lookup returns, in the order
 * Consent gives them (or, for a curated `open-access-datasets`, in the listed order). Consent
 * applies eligibility, so the open-access shelf holds open datasets only.
 *
 * - Loading (D11): the heading and a skeleton at card height, announced once as "Loading
 *   datasets". The skeleton is hidden from assistive technology.
 * - Failed (D12): the heading stays, with a message and "Try again" in place of the cards. Mock
 *   or cached data is never shown. After a 429 (D13), "Try again" is off for the `Retry-After`
 *   seconds, or 60 when the browser can't read the header, with a countdown that describes it.
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
import React, { useContext, useEffect, useId, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MuiSkeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { DatasetCard } from 'src/components/showcase/primitives/DatasetCard'
import { Shelf } from 'src/components/showcase/primitives/Shelf'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import { datasetShelfSx } from 'src/components/showcase/sections/datasetShelfStyles'
import type { SectionRendererProps } from 'src/components/showcase/sectionRegistry'
import { ShowcaseLookupsContext } from 'src/components/showcase/showcaseTemplateContract'
import type { ShowcaseLookupError } from 'src/libs/ajax/ShowcaseCatalog'
import type { DatasetSectionKey } from 'src/types/showcase'

/** Provisional copy (S3.3; D11 and D12 wording from the contracts record). */
export const DATASETS_LOADING_TEXT = 'Loading datasets'
export const DATASETS_FAILED_TEXT = 'These datasets can\'t be loaded right now.'
export const TRY_AGAIN_LABEL = 'Try again'
export const SEE_ALL_LABEL = 'See all'
export const retryWaitText = (seconds: number) => `You can try again in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`

/** D13: the wait when a 429 has no `Retry-After` the browser can read (legacy mode until DT-4422).
 * 60 seconds always clears the lookup's 120-a-minute limit. */
export const RETRY_FALLBACK_SECONDS = 60

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
    <Stack direction="row" aria-hidden="true" sx={datasetShelfSx.skeleton}>
      {Array.from({ length: SKELETON_CARDS }, (_, i) => <MuiSkeleton key={i} variant="rounded" sx={datasetShelfSx.skeletonCard} />)}
    </Stack>
  </>
)

/** The seconds to wait before "Try again": the `Retry-After` of a 429, else 0. */
const waitSeconds = (error: ShowcaseLookupError) =>
  error.status === 429 ? Math.max(0, error.retryAfterSeconds ?? RETRY_FALLBACK_SECONDS) : 0

/**
 * Whole seconds left until `seconds` from mount have passed. A new failure mounts a new `Failed`.
 * Each timeout ends when the shown number must drop, measured from the deadline, so a late or early
 * timer never keeps the button off for an extra second.
 */
const useCountdown = (seconds: number) => {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (seconds <= 0) return
    const deadline = Date.now() + seconds * 1000
    let timer: ReturnType<typeof setTimeout>
    const step = () => {
      const ms = deadline - Date.now()
      const next = Math.max(0, Math.ceil(ms / 1000))
      setLeft(next)
      if (next > 0) timer = setTimeout(step, ms - (next - 1) * 1000)
    }
    timer = setTimeout(step, 1000)
    return () => clearTimeout(timer)
  }, [seconds])
  return left
}

/** `aria-disabled`, not `disabled`, so the button keeps focus while it waits (D13). */
const Failed = ({ error, onRetry }: { error: ShowcaseLookupError, onRetry: () => void }) => {
  const left = useCountdown(waitSeconds(error))
  const waitId = useId()
  const waiting = left > 0
  return (
    <Stack direction="row" sx={datasetShelfSx.failed}>
      <Typography variant="inherit" sx={datasetShelfSx.message}>{DATASETS_FAILED_TEXT}</Typography>
      <Button
        variant="outlined"
        disableRipple
        aria-disabled={waiting || undefined}
        aria-describedby={waiting ? waitId : undefined}
        onClick={waiting ? undefined : onRetry}
        sx={datasetShelfSx.retry}
      >
        {TRY_AGAIN_LABEL}
      </Button>
      {waiting && <Typography variant="inherit" component="span" id={waitId} sx={datasetShelfSx.wait}>{retryWaitText(left)}</Typography>}
    </Stack>
  )
}

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
        {state.status === 'loading' ? <Skeleton /> : <Failed error={state.error} onRetry={retry} />}
      </Frame>
    )
  }

  return <Box id={id} sx={datasetShelfSx.root}>{body}</Box>
}
