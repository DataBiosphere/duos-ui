/**
 * The showcase hero (DT-4355, S3.3): the page's `h1`, an optional subtitle, the intro text, calls
 * to action, onboarding links and date-bounded announcements. On desktop the intro column sits
 * beside the announcements; below 980px they stack (D15). The background is a static decoration
 * from the theme colors, with no image (MVP).
 *
 * The heading is the page's one `h1` and the skip link's target (D7), so it carries
 * `SHOWCASE_MAIN_HEADING_ID` and `tabIndex={-1}`.
 *
 * The hero `<section>` has no accessible name, so it is not a region landmark. Its heading is
 * usually the showcase title, which already names the masthead region; a second region with the
 * same name would be ambiguous in a landmark list. The hero is the top of `<main>`, and the `h1`
 * is what the skip link reaches.
 *
 * The live stats sit between the intro and the calls to action, inside the hero (D14). A stat that
 * is 0 is hidden, and when the counts can't load the whole strip goes and the calls to action move
 * up. There is no data-size stat: DUOS has no trusted byte-size source (contracts record).
 */
import React, { useContext, useId, useState } from 'react'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import { isShownHref } from 'src/components/showcase/primitives/safeHref'
import type { EnabledSection, SectionRendererProps } from 'src/components/showcase/sectionRegistry'
import { currentAnnouncements, type HeroStatKey, heroStatLabel, heroStats } from 'src/components/showcase/sections/heroContent'
import { heroSx } from 'src/components/showcase/sections/heroStyles'
import {
  SHOWCASE_MAIN_HEADING_ID,
  ShowcaseClockContext,
  ShowcaseLookupsContext,
  ShowcasePageInfoContext,
} from 'src/components/showcase/showcaseTemplateContract'
import { useUtcDay } from 'src/components/showcase/useUtcDay'

/** Provisional copy (S3.3). */
export const ONBOARDING_LABEL = 'Get started'
export const ANNOUNCEMENTS_LABEL = 'Announcements'
export const PREVIOUS_ANNOUNCEMENT_LABEL = 'Previous announcement'
export const NEXT_ANNOUNCEMENT_LABEL = 'Next announcement'
export const HERO_STATS_LABEL = 'Showcase totals'

type HeroLink = EnabledSection<'hero'>['primaryCtas'][number]
type Announcement = EnabledSection<'hero'>['announcements'][number]

const LinkList = ({ links, sx, labelledBy }: { links: readonly HeroLink[], sx: SxProps<Theme>, labelledBy?: string }) => (
  <Box component="ul" sx={sx} aria-labelledby={labelledBy}>
    {links.map(link => <li key={`${link.label}-${link.url}`}><ShowcaseLink href={link.url}>{link.label}</ShowcaseLink></li>)}
  </Box>
)

const Stats = ({ stats }: { stats: readonly HeroStatKey[] }) => {
  const lookups = useContext(ShowcaseLookupsContext)
  const { toolCount = 0 } = useContext(ShowcasePageInfoContext)
  const shown = heroStats(stats, lookups.hero, toolCount)
  if (shown === undefined) return null
  return (
    <Stack component="ul" direction="row" aria-label={HERO_STATS_LABEL} sx={heroSx.stats}>
      {shown.map(({ key, value }) => (
        <Stack component="li" key={key}>
          <Typography variant="inherit" component="span" sx={heroSx.statValue}>{value.toLocaleString('en-US')}</Typography>
          {' '}
          <Typography variant="inherit" component="span" sx={heroSx.statLabel}>{heroStatLabel(key, value)}</Typography>
        </Stack>
      ))}
    </Stack>
  )
}

const Onboarding = ({ links }: { links: readonly HeroLink[] }) => {
  const headingId = useId()
  if (links.length === 0) return null
  return (
    <Box sx={heroSx.onboarding}>
      <Typography variant="inherit" component="h2" id={headingId} sx={heroSx.subheading}>{ONBOARDING_LABEL}</Typography>
      <LinkList links={links} sx={heroSx.onboardingLinks} labelledBy={headingId} />
    </Box>
  )
}

/**
 * The announcements, one at a time (D5, D6): no autoplay and no pause button. "Previous" and
 * "Next" buttons with a visible "2 of 4" position, which wrap at both ends, so focus never lands on
 * a disabled button. Only the active announcement is rendered, so the others leave the tab order
 * and the accessibility tree. With one announcement there are no controls; with none, no panel.
 */
const Announcements = ({ announcements }: { announcements: readonly Announcement[] }) => {
  const [index, setIndex] = useState(0)
  const headingId = useId()
  const count = announcements.length
  if (count === 0) return null
  // The list can shrink between renders (a window ends), so keep the index in range.
  const active = Math.min(index, count - 1)
  const current = announcements[active]
  const move = (step: number) => setIndex((active + step + count) % count)

  return (
    <Paper component="section" variant="outlined" aria-labelledby={headingId} sx={heroSx.announcements}>
      <Typography variant="inherit" component="h2" id={headingId} sx={heroSx.subheading}>{ANNOUNCEMENTS_LABEL}</Typography>
      <Box aria-live="polite" sx={heroSx.announcement}>
        <ShowcaseLink key={current.id} href={current.url}>{current.text}</ShowcaseLink>
      </Box>
      {count > 1 && (
        <Stack direction="row" spacing="12px" sx={heroSx.announcementControls}>
          <IconButton aria-label={PREVIOUS_ANNOUNCEMENT_LABEL} onClick={() => move(-1)} sx={heroSx.announcementButton}>
            <ChevronLeftIcon aria-hidden />
          </IconButton>
          <Typography variant="inherit" component="span" sx={heroSx.announcementPosition}>{`${active + 1} of ${count}`}</Typography>
          <IconButton aria-label={NEXT_ANNOUNCEMENT_LABEL} onClick={() => move(1)} sx={heroSx.announcementButton}>
            <ChevronRightIcon aria-hidden />
          </IconButton>
        </Stack>
      )}
    </Paper>
  )
}

export const Hero = ({ section, id, title }: SectionRendererProps<'hero'>) => {
  const page = useContext(ShowcasePageInfoContext)
  const clock = useContext(ShowcaseClockContext)
  const shown = (links: readonly HeroLink[]) => links.filter(link => isShownHref(link.url, page.visibleSectionIds))
  const ctas = shown(section.primaryCtas)
  const intro = section.intro.trim()
  // Re-renders at UTC midnight, so the announcements follow their date windows on an open page.
  useUtcDay(clock)
  const announcements = currentAnnouncements(section.announcements, clock, page.visibleSectionIds)

  return (
    <Box component="section" id={id} sx={heroSx.root}>
      <Box sx={announcements.length > 0 ? [heroSx.inner, heroSx.innerWithAnnouncements] : heroSx.inner}>
        <div>
          <Typography variant="inherit" component="h1" id={SHOWCASE_MAIN_HEADING_ID} tabIndex={-1} sx={heroSx.title}>{title ?? page.title}</Typography>
          {section.subtitle !== undefined && section.subtitle.trim() !== '' && <Typography variant="inherit" sx={heroSx.subtitle}>{section.subtitle}</Typography>}
          {intro !== '' && <Typography variant="inherit" sx={heroSx.text}>{intro}</Typography>}
          <Stats stats={section.stats} />
          {ctas.length > 0 && <LinkList links={ctas} sx={heroSx.ctas} />}
          <Onboarding links={shown(section.onboarding)} />
        </div>
        <Announcements announcements={announcements} />
      </Box>
    </Box>
  )
}
