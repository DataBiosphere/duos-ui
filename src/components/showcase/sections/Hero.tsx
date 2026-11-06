/**
 * The showcase hero (DT-4355, S3.3): the page's `h1`, an optional subtitle, the intro text, calls
 * to action and onboarding links. The background is a static decoration from the theme colors, with
 * no image (MVP).
 *
 * The heading is the page's one `h1` and the skip link's target (D7), so it carries
 * `SHOWCASE_MAIN_HEADING_ID` and `tabIndex={-1}`.
 *
 * The hero `<section>` has no accessible name, so it is not a region landmark. Its heading is
 * usually the showcase title, which already names the masthead region; a second region with the
 * same name would be ambiguous in a landmark list. The hero is the top of `<main>`, and the `h1`
 * is what the skip link reaches.
 *
 * Announcements and the live stats come in later PRs; this renderer shows neither yet.
 */
import React, { useContext, useId } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import { isShownHref } from 'src/components/showcase/primitives/safeHref'
import type { EnabledSection, SectionRendererProps } from 'src/components/showcase/sectionRegistry'
import { heroSx } from 'src/components/showcase/sections/heroStyles'
import { SHOWCASE_MAIN_HEADING_ID, ShowcasePageInfoContext } from 'src/components/showcase/showcaseTemplateContract'

/** Provisional copy (S3.3). */
export const ONBOARDING_LABEL = 'Get started'

type HeroLink = EnabledSection<'hero'>['primaryCtas'][number]

const LinkList = ({ links, sx, labelledBy }: { links: readonly HeroLink[], sx: SxProps<Theme>, labelledBy?: string }) => (
  <Box component="ul" sx={sx} aria-labelledby={labelledBy}>
    {links.map(link => <li key={`${link.label}-${link.url}`}><ShowcaseLink href={link.url}>{link.label}</ShowcaseLink></li>)}
  </Box>
)

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

export const Hero = ({ section, id, title }: SectionRendererProps<'hero'>) => {
  const page = useContext(ShowcasePageInfoContext)
  const shown = (links: readonly HeroLink[]) => links.filter(link => isShownHref(link.url, page.visibleSectionIds))
  const ctas = shown(section.primaryCtas)
  const intro = section.intro.trim()

  return (
    <Box component="section" id={id} sx={heroSx.root}>
      <Box sx={heroSx.inner}>
        <div>
          <Typography variant="inherit" component="h1" id={SHOWCASE_MAIN_HEADING_ID} tabIndex={-1} sx={heroSx.title}>{title ?? page.title}</Typography>
          {section.subtitle !== undefined && section.subtitle.trim() !== '' && <Typography variant="inherit" sx={heroSx.subtitle}>{section.subtitle}</Typography>}
          {intro !== '' && <Typography variant="inherit" sx={heroSx.text}>{intro}</Typography>}
          {ctas.length > 0 && <LinkList links={ctas} sx={heroSx.ctas} />}
          <Onboarding links={shown(section.onboarding)} />
        </div>
      </Box>
    </Box>
  )
}
