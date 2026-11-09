/**
 * The showcase masthead (DT-4354, S3.2): the showcase's own logo, up to three partner logos, the
 * data library search and the sub-nav, below the DUOS header. The DUOS header has the DUOS logo and
 * Sign in, so the masthead has neither (contracts record, D10).
 *
 * It sticks to the top of the window on tablet and desktop, and not on phones (D8). While it
 * sticks, it sets `scroll-padding-top` on the page root (`<html>`) to its own height. So nothing
 * the browser scrolls into view is hidden under it: a section that a sub-nav link targets, a
 * control that gets keyboard focus (WCAG 2.4.11), or the heading that the skip link focuses.
 *
 * Built from MUI components. Colors and fonts come from the showcase theme custom properties, which
 * the template sets, not from the MUI theme. Logo heights, spacing and breakpoints are provisional
 * (D10, D15).
 */
import React, { type FormEvent, useContext, useId, useLayoutEffect, useRef, useState } from 'react'
import { Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { librarySearchPath, ShowcaseHandoffsContext } from 'src/components/showcase/handoffs'
import { ShowcaseLink, SIGN_IN_REQUIRED_TEXT } from 'src/components/showcase/primitives/ShowcaseLink'
import type { SectionRendererProps } from 'src/components/showcase/sectionRegistry'
import { type Logo, shownLogos } from 'src/components/showcase/sections/mastheadLogos'
import { ShowcasePageInfoContext, type SubNavLink } from 'src/components/showcase/showcaseTemplateContract'
import { imageLoading } from 'src/showcases/imageLoading'

/** Provisional copy (S3.2). */
export const SEARCH_LABEL = 'Search DUOS datasets'
export const SEARCH_UNAVAILABLE_TEXT = 'Search is not available in this preview.'
export const SUB_NAV_LABEL = 'Sections on this page'

/** D10: on phones only the showcase's own logo is shown, at a smaller height. */
const PHONE = '@media (max-width: 767px)'
/** D15: search moves below the branding on phones. */
const NARROW = '@media (max-width: 560px)'
/** D8: sticky on tablet and desktop only. A landscape phone is 844-932px wide but about 400px
 * tall, so the height condition keeps it from sticking there and covering much of the screen. */
const STICKY = '@media (min-width: 768px) and (min-height: 600px)'

const logoHeight = { height: 48, [PHONE]: { height: 36 } }

/** A logo that can't load shows its alt text at the logo's height. */
const logoTextSx = {
  ...logoHeight,
  display: 'inline-flex',
  alignItems: 'center',
  m: 0,
  fontFamily: 'var(--showcase-font-heading)',
  fontSize: 'var(--showcase-font-size-card-title)',
  fontWeight: 'var(--showcase-font-weight-heading)',
  color: 'var(--showcase-primary)',
}

/** A logo image that shows its alt text, at the same height, when it can't load. */
const LogoImage = ({ src, alt }: { src: string | undefined, alt: string }) => {
  const [failed, setFailed] = useState(false)
  if (src === undefined || failed) {
    return <Typography component="span" className="showcase-masthead__logo-text" sx={logoTextSx}>{alt}</Typography>
  }
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading={imageLoading('masthead')}
      onError={() => setFailed(true)}
      sx={{ ...logoHeight, display: 'block', width: 'auto', maxWidth: '100%' }}
    />
  )
}

const LogoList = ({ logos, title }: { logos: readonly Logo[], title: string }) => {
  const { visibleSectionIds } = useContext(ShowcasePageInfoContext)
  const shown = shownLogos(logos, title, visibleSectionIds)
  if (shown.length === 0) {
    return <Typography component="p" sx={logoTextSx}>{title}</Typography>
  }
  return (
    <Stack component="ul" direction="row" useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 2, minWidth: 0, m: 0, p: 0, listStyle: 'none' }}>
      {shown.map((logo, i) => (
        <Box
          component="li"
          key={`${i}-${logo.alt}`}
          className={i === 0 ? undefined : 'showcase-masthead__logo--partner'}
          sx={i === 0 ? undefined : { [PHONE]: { display: 'none' } }}
        >
          {logo.url === undefined
            ? <LogoImage src={logo.src} alt={logo.alt} />
            : <ShowcaseLink href={logo.url}><LogoImage src={logo.src} alt={logo.alt} /></ShowcaseLink>}
        </Box>
      ))}
    </Stack>
  )
}

const searchFieldSx = {
  'width': 280,
  'maxWidth': '100%',
  'minWidth': 0,
  '& .MuiInputBase-root': { font: 'inherit', bgcolor: 'var(--showcase-surface)' },
  '& .MuiInputBase-input': { py: 1, px: 1.5, height: 'auto' },
  // WCAG 1.4.11: a field's edge needs 3:1 against the surface. Muted text gives 4.88:1 on white;
  // the MUI default outline gives about 1.6:1. Focus keeps the same edge: the showcase focus ring
  // (D9) marks it, so the MUI focus border would draw a second ring.
  '& .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--showcase-muted-text)',
    borderWidth: 1,
  },
  '& .MuiFormHelperText-root': { mx: 0, color: 'var(--showcase-muted-text)', fontSize: 'var(--showcase-font-size-label)' },
  [NARROW]: { flex: '1 1 100%', width: 'auto' },
}

const searchButtonSx = {
  'font': 'inherit',
  'fontWeight': 600,
  'minHeight': 40,
  'textTransform': 'none',
  'bgcolor': 'var(--showcase-primary)',
  'color': '#ffffff',
  '&:hover': { bgcolor: 'var(--showcase-primary)', filter: 'brightness(0.9)' },
  '&.Mui-disabled': { bgcolor: 'var(--showcase-primary)', color: '#ffffff', opacity: 0.6 },
}

/** Search hands off to the signed-in data library with the text as its `query`. A native GET form,
 * so it works the same before the router takes over; with the router it navigates in place. */
const LibrarySearch = () => {
  const { enabled, signedIn } = useContext(ShowcaseHandoffsContext)
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const inputId = useId()
  // TextField gives its helper text this id and puts it in the input's aria-describedby.
  const noteId = `${inputId}-helper-text`
  const showNote = !enabled || !signedIn
  const noteText = enabled ? SIGN_IN_REQUIRED_TEXT : SEARCH_UNAVAILABLE_TEXT

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (enabled) navigate(librarySearchPath(text))
  }

  return (
    <Box
      component="form"
      role="search"
      action="/datalibrary"
      method="get"
      onSubmit={submit}
      sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1, minWidth: 0, [NARROW]: { flex: '1 1 100%' } }}
    >
      <TextField
        id={inputId}
        type="search"
        name="query"
        size="small"
        placeholder={SEARCH_LABEL}
        value={text}
        onChange={event => setText(event.target.value)}
        disabled={!enabled}
        helperText={showNote ? noteText : undefined}
        slotProps={{ htmlInput: { 'aria-label': SEARCH_LABEL } }}
        sx={searchFieldSx}
      />
      <Button type="submit" variant="contained" disableElevation disabled={!enabled} aria-describedby={showNote ? noteId : undefined} sx={searchButtonSx}>
        Search
      </Button>
    </Box>
  )
}

/** The sub-nav scrolls sideways when its links don't fit, rather than widening the page. */
const SubNav = ({ links }: { links: readonly SubNavLink[] }) => {
  if (links.length === 0) return null
  return (
    <Box component="nav" aria-label={SUB_NAV_LABEL} sx={{ maxWidth: 1400, mx: 'auto', px: 2, overflowX: 'auto' }}>
      <Stack component="ul" direction="row" useFlexGap sx={{ gap: 3, m: 0, pt: 1, pb: 1.5, px: 0, listStyle: 'none', whiteSpace: 'nowrap' }}>
        {links.map(link => (
          <li key={link.id}>
            {/* src/index.css removes every link underline with !important; color alone would not
              * mark a link (WCAG 1.4.1). */}
            <Link
              href={`#${link.id}`}
              sx={{ color: 'var(--showcase-primary)', fontSize: 'var(--showcase-font-size-label)', fontWeight: 600, textDecoration: 'underline !important', textDecorationColor: 'currentColor' }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </Stack>
    </Box>
  )
}

/** Keeps the page's `scroll-padding-top` equal to the masthead's height while it sticks, and
 * clears it when it doesn't (phones, D8) or when the masthead unmounts. */
const useStickyScrollPadding = (ref: React.RefObject<HTMLElement | null>) => {
  useLayoutEffect(() => {
    const masthead = ref.current
    if (!masthead) return
    const page = document.documentElement
    const update = () => {
      const sticks = getComputedStyle(masthead).position === 'sticky'
      page.style.scrollPaddingTop = sticks ? `${masthead.offsetHeight}px` : ''
    }
    update()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(masthead)
    globalThis.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      globalThis.removeEventListener('resize', update)
      page.style.scrollPaddingTop = ''
    }
  }, [ref])
}

const mastheadSx = {
  zIndex: 10,
  bgcolor: 'var(--showcase-surface)',
  borderBottom: '1px solid var(--showcase-border)',
  [STICKY]: { position: 'sticky', top: 0 },
}

export const Masthead = ({ section, id }: SectionRendererProps<'masthead'>) => {
  const { title, subNav } = useContext(ShowcasePageInfoContext)
  const ref = useRef<HTMLElement>(null)
  useStickyScrollPadding(ref)

  return (
    // The class name lets tests find the element that sticks.
    <Box component="section" ref={ref} id={id} className="showcase-masthead" aria-label={title} sx={mastheadSx}>
      <Stack
        direction="row"
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', rowGap: 1.5, columnGap: 3, maxWidth: 1400, mx: 'auto', px: 2, py: 1.5 }}
      >
        <LogoList logos={section.logos} title={title} />
        <LibrarySearch />
      </Stack>
      <SubNav links={subNav} />
    </Box>
  )
}
