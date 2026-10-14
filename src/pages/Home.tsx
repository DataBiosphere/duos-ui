import React, { useMemo, useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
import type { SystemStyleObject } from '@mui/system'
import { ArrowForward, CheckCircleOutlined, Pause, PlayArrow } from '@mui/icons-material'
import homeHeaderBackground from 'src/images/home_header_background.png'
import homeHeaderVideoWebm from 'src/images/home_header_background.webm'
import homeHeaderVideoMp4 from 'src/images/home_header_background.mp4'
import duosLogoImg from 'src/images/duos_logo.svg'
import duosDiagram from 'src/images/DUOS_Homepage_diagram.svg'
import broadLogo from 'src/images/broad_logo_allwhite.png'
import dacIcon from 'src/images/dac_icon.svg'
import signingOfficialIcon from 'src/images/icon_add_user.png'
import datasetIcon from 'src/images/icon_dataset_.png'
import datasetAddIcon from 'src/images/icon_dataset_add.png'
import documentIcon from 'src/images/icon-document.png'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router'
import { getLibraryVersions } from 'src/libs/libraryVersions'
import { handleSignIn } from 'src/libs/signInUtils'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'

export interface HomeProps {
  isLogged: boolean
}

const homeTitle: React.CSSProperties = {
  color: '#FFFFFF',
  fontFamily: 'Montserrat',
  fontSize: '28px',
  fontWeight: 600,
  textAlign: 'center',
  padding: '0 5rem',
}

const homeBannerDescription: React.CSSProperties = {
  color: '#FFFFFF',
  fontFamily: 'Montserrat',
  fontSize: '20px',
  textAlign: 'center',
  whiteSpace: 'pre-wrap',
  padding: '0 10rem',
}

const heroMedia: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 'inherit',
  objectFit: 'cover',
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const duosLogoStyle: React.CSSProperties = {
  height: '80px',
  width: '300px',
  display: 'block',
  margin: '0 auto 3rem',
  padding: '0 3rem',
}

const DAC_GUIDE_URL = 'https://duos.blog/help/dacguide/'
const SO_GUIDE_URL = 'https://duos.blog/help/signingofficialguide/'
const RESEARCHER_GUIDE_URL = 'https://duos.blog/help/researcherguide/'
const SIMPLE_SETUP_TEXT = 'Simple one-time setup — no repeat steps per dataset'

// Font sizes are in px because the root font-size is 10px (see src/libs/muiThemeFix.ts).
const color = {
  ink: '#0F2537',
  body: '#475569',
  muted: '#64748B',
  navy: '#1F3B50',
  blue: '#00609F',
  surface: '#FFFFFF',
  surfaceMuted: '#F6F8FA',
  border: '#E3E8EE',
  borderStrong: '#CBD5E1',
}

const shadowSm = '0 1px 2px rgba(15, 37, 55, 0.04), 0 4px 12px rgba(15, 37, 55, 0.05)'
const shadowLg = '0 2px 4px rgba(15, 37, 55, 0.04), 0 16px 40px rgba(15, 37, 55, 0.10)'

interface Accent {
  main: string
  hover: string
  soft: string
}

const accents = {
  navy: { main: color.navy, hover: '#2D5470', soft: 'rgba(31, 59, 80, 0.08)' },
  blue: { main: color.blue, hover: '#004C7E', soft: 'rgba(0, 96, 159, 0.08)' },
  // Dark enough for small text to meet 4.5:1 on its own soft background.
  teal: { main: '#007570', hover: '#006A65', soft: 'rgba(0, 128, 122, 0.09)' },
  purple: { main: '#6A3A96', hover: '#55297D', soft: 'rgba(106, 58, 150, 0.09)' },
} satisfies Record<string, Accent>

const focusRing = {
  '&:focus-visible, &.Mui-focusVisible': {
    outline: `2px solid ${color.blue}`,
    outlineOffset: '3px',
  },
}

const hoverLift = {
  'transition': 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
  '&:hover': { boxShadow: shadowLg, borderColor: color.borderStrong },
  '@media (prefers-reduced-motion: no-preference)': {
    '&:hover': { transform: 'translateY(-4px)' },
  },
}

const arrowSlide = {
  '& .home-arrow': { transition: 'transform 0.2s' },
  '&:hover .home-arrow': { transform: 'translateX(4px)' },
}

// The global `a:hover, a:focus` rule in bootstrap_replacement.css recolours and underlines
// every link, so links here restate their own colour and decoration for both states.
const linkStates = (textColor: string, hoverColor: string) => ({
  '&:focus': { color: textColor, textDecoration: 'none' },
  '&:hover': { color: hoverColor, textDecoration: 'none' },
})

const primaryButtonSx = (accent: Accent): SystemStyleObject<Theme> => ({
  'px': 2.5,
  'py': 1.25,
  'fontSize': '14px',
  'fontWeight': 600,
  'lineHeight': 1.2,
  'textTransform': 'none',
  'borderRadius': '10px',
  'color': '#FFFFFF',
  'bgcolor': accent.main,
  '&:focus': { color: '#FFFFFF', textDecoration: 'none' },
  '&:hover': { color: '#FFFFFF', textDecoration: 'none', bgcolor: accent.hover },
  ...focusRing,
})

const textLinkSx = (accent: Accent): SystemStyleObject<Theme> => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  fontSize: '13.5px',
  fontWeight: 600,
  color: accent.main,
  ...linkStates(accent.main, accent.hover),
  ...arrowSlide,
  ...focusRing,
})

const Arrow = () => <ArrowForward className="home-arrow" aria-hidden="true" sx={{ fontSize: '16px' }} />

const SectionHead = ({ id, eyebrow, title, children }: { id: string, eyebrow: string, title: string, children: React.ReactNode }) => (
  // The eyebrow follows the heading in the DOM so screen readers reach the heading first.
  <Stack sx={{ maxWidth: 680, mx: 'auto', mb: { xs: 3.5, md: 4.5 }, textAlign: 'center', alignItems: 'center' }}>
    <Typography
      id={id}
      variant="h2"
      sx={{ mb: 1.25, fontSize: 'clamp(24px, 2.6vw, 32px)', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.015em', color: color.ink }}
    >
      {title}
    </Typography>
    <Typography
      variant="overline"
      sx={{
        'order': -1,
        'display': 'inline-flex',
        'alignItems': 'center',
        'gap': 1.25,
        'mb': 1.25,
        'fontSize': '12px',
        'fontWeight': 700,
        'lineHeight': 1.5,
        'letterSpacing': '0.14em',
        'color': accents.teal.main,
        '&::before': {
          content: '""',
          width: 24,
          height: 2,
          borderRadius: '2px',
          background: `linear-gradient(90deg, ${color.blue}, ${accents.teal.main})`,
        },
      }}
    >
      {eyebrow}
    </Typography>
    <Typography sx={{ fontSize: '16px', lineHeight: 1.6, color: color.body }}>{children}</Typography>
  </Stack>
)

const HomeSection = ({ labelledBy, muted = false, sx, children }: { labelledBy: string, muted?: boolean, sx?: SxProps<Theme>, children: React.ReactNode }) => (
  <Box
    component="section"
    aria-labelledby={labelledBy}
    sx={[
      { position: 'relative', py: { xs: 6, md: 8 }, px: { xs: 2, md: 3 } },
      muted && { bgcolor: color.surfaceMuted, borderTop: `1px solid ${color.border}` },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Container maxWidth="lg" disableGutters sx={{ position: 'relative' }}>
      {children}
    </Container>
  </Box>
)

interface AudienceCardProps {
  accent: Accent
  icon: string
  tagline: string
  title: string
  features: string[]
  children: React.ReactNode
}

const AudienceCard = ({ accent, icon, tagline, title, features, children }: AudienceCardProps) => (
  <Card
    variant="outlined"
    sx={{
      'position': 'relative',
      'display': 'flex',
      'flexDirection': 'column',
      'height': '100%',
      'borderColor': color.border,
      'borderRadius': '16px',
      'boxShadow': shadowSm,
      ...hoverLift,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        bgcolor: accent.main,
        transform: 'scaleX(0)',
        transformOrigin: 'left',
        transition: 'transform 0.35s',
      },
      '&:hover::before': { transform: 'scaleX(1)' },
    }}
  >
    {/* The tagline and icon follow the heading in the DOM so screen readers reach the heading first. */}
    <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: { xs: '24px 20px 0', md: '26px 26px 0' } }}>
      <Typography variant="h3" sx={{ mb: 1.5, fontSize: '21px', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', color: color.ink }}>
        {title}
      </Typography>
      <Typography sx={{ order: -1, mb: 1, fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent.main }}>
        {tagline}
      </Typography>
      <Box sx={{ order: -2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 48, mb: 2, borderRadius: '12px', bgcolor: accent.soft }}>
        <Box component="img" src={icon} alt="" sx={{ width: 28, height: 28, objectFit: 'contain' }} />
      </Box>
      <Stack component="ul" sx={{ flex: 1, m: '0 0 18px', p: 0, listStyle: 'none' }}>
        {features.map(feature => (
          <Box component="li" key={feature} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 0.625, fontSize: '14px', lineHeight: 1.55, color: color.body }}>
            <CheckCircleOutlined aria-hidden="true" sx={{ flexShrink: 0, mt: '2px', fontSize: '18px', color: accent.main }} />
            {feature}
          </Box>
        ))}
      </Stack>
    </CardContent>
    <CardActions
      disableSpacing
      sx={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 1.5,
        mx: { xs: 2.5, md: 3.25 },
        px: 0,
        pt: 2.25,
        pb: 3,
        borderTop: `1px solid ${color.border}`,
      }}
    >
      {children}
    </CardActions>
  </Card>
)

const AudienceCardNote = ({ children }: { children: React.ReactNode }) => (
  <Typography sx={{ fontSize: '12.5px', lineHeight: 1.5, color: color.muted, textAlign: 'center' }}>{children}</Typography>
)

const MockWindow = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <Paper variant="outlined" sx={{ overflow: 'hidden', borderColor: color.border, borderRadius: '12px', boxShadow: shadowLg }}>
    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, px: 1.75, py: 1.25, borderBottom: `1px solid ${color.border}` }}>
      {[0, 1, 2].map(i => <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color.borderStrong }} />)}
      <Typography sx={{ ml: 1, fontSize: '12px', fontWeight: 600, color: color.muted }}>{title}</Typography>
    </Stack>
    <Stack sx={{ gap: 1.25, p: 2 }}>{children}</Stack>
  </Paper>
)

const MockPill = ({ label, accent, muted = false }: { label: string, accent: Accent, muted?: boolean }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      flexShrink: 0,
      height: 22,
      fontSize: '11px',
      fontWeight: 700,
      // color.muted is 4.47:1 on surfaceMuted, just under 4.5:1, so muted pills use body text.
      color: muted ? color.body : accent.main,
      bgcolor: muted ? color.surfaceMuted : accent.soft,
    }}
  />
)

const MockLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: color.muted }}>
    {children}
  </Typography>
)

const MockSkeleton = ({ width }: { width: string }) => (
  <Skeleton variant="rounded" animation={false} width={width} height={8} sx={{ bgcolor: color.surfaceMuted }} />
)

const MockRow = ({ dot, label, pill, accent, muted = false }: { dot: string, label: string, pill: string, accent: Accent, muted?: boolean }) => (
  <Stack
    direction="row"
    sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1.5, px: 1.5, py: 1.25, border: `1px solid ${color.border}`, borderRadius: '8px' }}
  >
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Avatar sx={{ width: 22, height: 22, fontSize: '11px', fontWeight: 700, color: accent.main, bgcolor: accent.soft }}>{dot}</Avatar>
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: color.ink }}>{label}</Typography>
    </Stack>
    <MockPill label={pill} accent={accent} muted={muted} />
  </Stack>
)

type PreviewProps = { accent: Accent }

const ResearcherPreview = ({ accent }: PreviewProps) => (
  <MockWindow title="Data Access Request">
    <MockLabel>Application · 3 of 4 steps</MockLabel>
    <LinearProgress
      variant="determinate"
      value={75}
      sx={{ 'height': 6, 'borderRadius': '3px', 'bgcolor': color.surfaceMuted, '& .MuiLinearProgress-bar': { bgcolor: accent.main, borderRadius: '3px' } }}
    />
    <MockRow accent={accent} dot="✓" label="Datasets selected" pill="3 datasets" />
    <MockRow accent={accent} dot="✓" label="Research purpose" pill="Complete" />
    <MockRow accent={accent} dot="✓" label="Collaborators" pill="2 added" />
    <MockRow accent={accent} dot="4" label="Data Access Agreements" pill="In progress" muted />
  </MockWindow>
)

const SubmitterPreview = ({ accent }: PreviewProps) => (
  <MockWindow title="Dataset registration">
    <MockLabel>Study</MockLabel>
    <MockSkeleton width="72%" />
    <MockSkeleton width="48%" />
    <MockLabel>Consent groups</MockLabel>
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
      <MockPill accent={accent} label="General Research Use" />
      <MockPill accent={accent} label="Disease-Specific" />
      <MockPill accent={accent} label="Health/Medical/Biomedical" />
    </Stack>
    <MockRow accent={accent} dot="✓" label="Data Access Committee" pill="Assigned" />
  </MockWindow>
)

const DacPreview = ({ accent }: PreviewProps) => (
  <MockWindow title="Request review">
    <MockLabel>Research purpose</MockLabel>
    <MockSkeleton width="84%" />
    <MockSkeleton width="60%" />
    <MockRow accent={accent} dot="1" label="Dataset 1" pill="Approved" />
    <MockRow accent={accent} dot="2" label="Dataset 2" pill="Approved" />
    <MockRow accent={accent} dot="3" label="Dataset 3" pill="Vote pending" muted />
  </MockWindow>
)

const SigningOfficialPreview = ({ accent }: PreviewProps) => (
  <MockWindow title="Library Cards">
    <MockLabel>Your institution&#39;s researchers</MockLabel>
    <MockRow accent={accent} dot="PI" label="Principal Investigator" pill="Card issued" />
    <MockRow accent={accent} dot="RS" label="Research Scientist" pill="Card issued" />
    <MockRow accent={accent} dot="PF" label="Postdoctoral Fellow" pill="DAA pending" muted />
  </MockWindow>
)

interface RoleSection {
  id: string
  name: string
  icon: string
  accent: Accent
  title: string
  summary: string
  features: { title: string, text: string }[]
  // Roles without a guide link get a button that opens the contact modal.
  guide?: { label: string, href: string }
  Preview: (props: PreviewProps) => React.JSX.Element
}

const roleSections: RoleSection[] = [
  {
    id: 'researcher',
    name: 'Researchers',
    icon: documentIcon,
    accent: accents.teal,
    title: 'Request controlled-access data in one application',
    summary: 'Find datasets in the Data Library, then submit a single request that DUOS routes to every responsible Data Access Committee.',
    features: [
      { title: 'Multi-dataset requests', text: 'Bundle datasets into one application, even across DACs.' },
      { title: 'Collaborators', text: 'Add internal and external collaborators to your request.' },
      { title: 'Agreements in-app', text: 'Review and accept required Data Access Agreements.' },
      { title: 'Stay compliant', text: 'Submit progress reports and closeouts as your project evolves.' },
    ],
    guide: { label: 'Read the Researcher Guide', href: RESEARCHER_GUIDE_URL },
    Preview: ResearcherPreview,
  },
  {
    id: 'submitter',
    name: 'Data Submitters',
    icon: datasetAddIcon,
    accent: accents.purple,
    title: 'Register studies and make them discoverable',
    summary: 'Describe your study once with a guided submission form, define how each consent group may be used, and choose the DAC that oversees access.',
    features: [
      { title: 'Guided submission', text: 'Capture study, NIH administrative, and data management details in one form.' },
      { title: 'Standardized data use', text: 'Record consent limitations such as General Research Use or Disease-Specific.' },
      { title: 'DAC assignment', text: 'Route each consent group to the committee that governs it.' },
      { title: 'Discoverability', text: 'Make your datasets findable in the DUOS Data Library.' },
    ],
    Preview: SubmitterPreview,
  },
  {
    id: 'dac',
    name: 'Data Access Committees',
    icon: dacIcon,
    accent: accents.navy,
    title: 'Review requests with full context',
    summary: 'See each request\'s research purpose alongside the data use limitations of every dataset, and record decisions dataset by dataset.',
    features: [
      { title: 'Per-dataset voting', text: 'Approve or deny each dataset in a request independently.' },
      { title: 'Automated matching', text: 'DUOS checks research purposes against consent terms.' },
      { title: 'Voting history', text: 'Every vote is recorded for audit and continuity.' },
      { title: 'Committee management', text: 'Manage members, chairs, and the datasets your DAC governs.' },
    ],
    guide: { label: 'Read the DAC Guide', href: DAC_GUIDE_URL },
    Preview: DacPreview,
  },
  {
    id: 'so',
    name: 'Signing Officials',
    icon: signingOfficialIcon,
    accent: accents.blue,
    title: 'Authorize researchers at your institution',
    summary: 'Issue Library Cards to pre-authorize researchers, manage institutional agreements, and keep oversight of your institution\'s data access.',
    features: [
      { title: 'Library Cards', text: 'Pre-authorize researchers once instead of signing off on every request.' },
      { title: 'Data Access Agreements', text: 'Assign DAAs to the researchers who need them.' },
      { title: 'Institutional visibility', text: 'Track your researchers\' requests and approvals in one place.' },
      { title: 'Simple setup', text: `${SIMPLE_SETUP_TEXT}.` },
    ],
    guide: { label: 'Read the Signing Official Guide', href: SO_GUIDE_URL },
    Preview: SigningOfficialPreview,
  },
]

const scrollToRole = (id: string) => {
  const target = document.getElementById(`role-${id}`)
  if (!target) return
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  // Moves keyboard focus with the scroll, so Tab continues from the section on screen.
  target.focus({ preventScroll: true })
}

const RoleRow = ({ role, reversed, onContact }: { role: RoleSection, reversed: boolean, onContact: () => void }) => {
  const { id, name, icon, accent, title, summary, features, guide, Preview } = role
  return (
    <Grid
      component="article"
      container
      id={`role-${id}`}
      tabIndex={-1}
      spacing={{ xs: 3.5, md: 7 }}
      sx={{
        'alignItems': 'center',
        'scrollMarginTop': '96px',
        '&:hover .role-feature': { borderLeftColor: accent.main },
      }}
    >
      <Grid size={{ xs: 12, md: 6 }} sx={{ order: { md: reversed ? 2 : 0 } }}>
        {/* The role tag follows the heading in the DOM so screen readers reach the heading first. */}
        <Stack sx={{ alignItems: 'flex-start' }}>
          <Typography variant="h3" sx={{ mb: 1.25, fontSize: 'clamp(21px, 2.2vw, 26px)', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em', color: color.ink }}>
            {title}
          </Typography>
          <Chip
            avatar={<Avatar src={icon} alt="" sx={{ 'p': '3px', 'bgcolor': color.surface, '& img': { objectFit: 'contain' } }} />}
            label={name}
            sx={{
              order: -1,
              mb: 1.5,
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: accent.main,
              bgcolor: accent.soft,
            }}
          />
          <Typography sx={{ mb: 2.5, fontSize: '15.5px', lineHeight: 1.6, color: color.body }}>{summary}</Typography>
          <Box
            component="ul"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: { xs: '12px', sm: '16px 24px' },
              width: '100%',
              m: '0 0 22px',
              p: 0,
              listStyle: 'none',
            }}
          >
            {features.map(feature => (
              <Box
                component="li"
                key={feature.title}
                className="role-feature"
                sx={{ pl: 1.75, borderLeft: `2px solid ${accent.soft}`, fontSize: '13.5px', lineHeight: 1.5, color: color.body, transition: 'border-color 0.2s' }}
              >
                <Box component="strong" sx={{ display: 'block', mb: 0.25, fontSize: '14px', fontWeight: 700, color: color.ink }}>
                  {feature.title}
                </Box>
                {feature.text}
              </Box>
            ))}
          </Box>
          {guide
            ? (
                <Link href={guide.href} target="_blank" rel="noreferrer" underline="none" sx={textLinkSx(accent)}>
                  {guide.label}
                  <Arrow />
                </Link>
              )
            : (
                <Button variant="contained" disableElevation onClick={onContact} sx={[primaryButtonSx(accent), { px: 2.25 }]}>
                  Talk to our team
                </Button>
              )}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }} aria-hidden="true">
        <Box
          sx={{
            p: { xs: 2, md: 3.5 },
            background: `linear-gradient(135deg, ${accent.soft} 0%, rgba(255, 255, 255, 0) 70%), ${color.surfaceMuted}`,
            border: `1px solid ${color.border}`,
            borderRadius: '20px',
          }}
        >
          <Preview accent={accent} />
        </Box>
      </Grid>
    </Grid>
  )
}

const HeroMedia = () => {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [paused, setPaused] = useState(false)

  if (reduceMotion) {
    return <img style={heroMedia} src={homeHeaderBackground} alt="" />
  }

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
    }
    else {
      video.pause()
    }
  }

  return (
    <>
      <video
        // React sets muted only as a property; iOS Safari checks the attribute before autoplaying.
        ref={(video) => {
          videoRef.current = video
          video?.setAttribute('muted', '')
        }}
        style={heroMedia}
        poster={homeHeaderBackground}
        // Kept off after a pause, so a video remounted by a motion-setting change stays paused.
        autoPlay={!paused}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src={homeHeaderVideoWebm} type="video/webm" />
        <source src={homeHeaderVideoMp4} type="video/mp4" />
      </video>
      <IconButton
        onClick={togglePlayback}
        aria-label={paused ? 'Play background animation' : 'Pause background animation'}
        size="small"
        sx={{
          'position': 'absolute',
          'right': 12,
          'bottom': 12,
          'zIndex': 1,
          'color': '#FFFFFF',
          'backgroundColor': 'rgba(15, 37, 55, 0.45)',
          '&:hover': { backgroundColor: 'rgba(15, 37, 55, 0.65)' },
        }}
      >
        {paused ? <PlayArrow fontSize="small" /> : <Pause fontSize="small" />}
      </IconButton>
    </>
  )
}

const Home = ({ isLogged }: Readonly<HomeProps>) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [showContactModal, setShowContactModal] = useState(false)

  const featuredLibraries = useMemo(() => {
    const allLibraries = getLibraryVersions(null, null)
    return Object.entries(allLibraries)
      .filter(([_key, library]) => library.featured)
      .map(([key, library]) => ({ key, ...library }))
      .sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order
        }
        return a.key.localeCompare(b.key)
      })
  }, [])

  return (
    <main className="row">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <div className="row" style={{ backgroundColor: 'white', height: '350px', position: 'relative', margin: '-20px auto auto 0' }}>
          <HeroMedia />
          <div style={{ position: 'absolute', width: '100%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <img style={duosLogoStyle} alt="DUOS logo" src={duosLogoImg} />
            <h1 style={homeTitle}>Data Use Oversight System</h1>
            <div className="hidden-xs" style={homeBannerDescription}>
              Access data faster.
              {' '}
            </div>
          </div>
        </div>

        <Box
          sx={{
            'fontFamily': 'Montserrat, sans-serif',
            'color': color.body,
            // Also stops MUI's own transitions and ripples.
            '@media (prefers-reduced-motion: reduce)': {
              '& *, & *::before, & *::after': { transition: 'none !important', animation: 'none !important' },
            },
          }}
        >
          <HomeSection
            labelledBy="home-audience-heading"
            sx={{
              'overflow': 'hidden',
              'background': `linear-gradient(180deg, ${color.surfaceMuted} 0%, ${color.surface} 100%)`,
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(rgba(31, 59, 80, 0.07) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
                maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 0%, transparent 75%)',
                pointerEvents: 'none',
              },
            }}
          >
            <SectionHead id="home-audience-heading" eyebrow="Who uses DUOS?" title="Built for every role in data sharing">
              Whether you oversee access, authorize researchers, or need data for your work — DUOS has you covered.
            </SectionHead>
            <Grid container spacing={2.5} sx={{ justifyContent: 'center' }}>
              <Grid size={{ xs: 12, sm: 8, md: 4 }}>
                <AudienceCard
                  accent={accents.navy}
                  icon={dacIcon}
                  tagline="Streamline access oversight"
                  title="DUOS for DACs"
                  features={[
                    'Centralized review of all incoming data access requests',
                    'Automated consent-code matching to research purposes',
                    'Audit-ready compliance tracking across every request',
                  ]}
                >
                  <Button variant="contained" disableElevation onClick={() => setShowContactModal(true)} sx={primaryButtonSx(accents.navy)}>
                    Request a Meeting
                  </Button>
                  <Link
                    id="blog-support-dac-link"
                    href={DAC_GUIDE_URL}
                    target="_blank"
                    rel="noreferrer"
                    underline="none"
                    sx={[textLinkSx(accents.navy), { alignSelf: 'center' }]}
                  >
                    Read the DAC Guide
                    <Arrow />
                  </Link>
                </AudienceCard>
              </Grid>
              <Grid size={{ xs: 12, sm: 8, md: 4 }}>
                <AudienceCard
                  accent={accents.blue}
                  icon={signingOfficialIcon}
                  tagline="Authorize your institution's researchers"
                  title="DUOS for Signing Officials"
                  features={[
                    'Promote and share your institution\'s data',
                    'Enable your PIs to request controlled-access datasets',
                    SIMPLE_SETUP_TEXT,
                  ]}
                >
                  <Button
                    id="blog-support-so-link"
                    variant="contained"
                    disableElevation
                    href={SO_GUIDE_URL}
                    target="_blank"
                    rel="noreferrer"
                    sx={primaryButtonSx(accents.blue)}
                  >
                    Signing Official Guide
                  </Button>
                  <AudienceCardNote>Sign in to get started</AudienceCardNote>
                </AudienceCard>
              </Grid>
              <Grid size={{ xs: 12, sm: 8, md: 4 }}>
                <AudienceCard
                  accent={accents.teal}
                  icon={datasetIcon}
                  tagline="Access hundreds of curated datasets"
                  title="Looking for Data?"
                  features={[
                    'Browse datasets from leading genomics & biomedical programs',
                    'Submit access requests directly through DUOS',
                    'Integrated with Terra, AnVIL, and other platforms',
                  ]}
                >
                  <Button variant="contained" disableElevation onClick={() => handleSignIn('/datalibrary', navigate)} sx={primaryButtonSx(accents.teal)}>
                    Sign In to Browse Data
                  </Button>
                  <AudienceCardNote>Search 1,000s of datasets and scientific assets</AudienceCardNote>
                </AudienceCard>
              </Grid>
            </Grid>
            <SupportRequestModal
              showModal={showContactModal}
              onCloseRequest={() => setShowContactModal(false)}
              url={location.pathname}
            />
          </HomeSection>

          <HomeSection labelledBy="home-roles-heading">
            <SectionHead id="home-roles-heading" eyebrow="Features by role" title="One platform, tailored to every role">
              See what DUOS offers at each step of the data sharing lifecycle.
            </SectionHead>
            <Stack
              component="nav"
              aria-label="Jump to a role"
              direction="row"
              sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: { xs: -0.5, md: -1.5 }, mb: { xs: 3.5, md: 5 } }}
            >
              {roleSections.map(role => (
                <Chip
                  key={role.id}
                  label={role.name}
                  variant="outlined"
                  onClick={() => scrollToRole(role.id)}
                  sx={{
                    'height': 34,
                    'px': 0.5,
                    'fontSize': '13px',
                    'fontWeight': 600,
                    'color': color.ink,
                    'bgcolor': color.surface,
                    'borderColor': color.border,
                    '&&:hover': { color: role.accent.main, borderColor: role.accent.main, bgcolor: role.accent.soft },
                    ...focusRing,
                  }}
                />
              ))}
            </Stack>
            <Stack sx={{ gap: { xs: 6, md: 7 } }}>
              {roleSections.map((role, index) => (
                <RoleRow key={role.id} role={role} reversed={index % 2 === 1} onContact={() => setShowContactModal(true)} />
              ))}
            </Stack>
          </HomeSection>

          <HomeSection labelledBy="home-libraries-heading" muted>
            <SectionHead id="home-libraries-heading" eyebrow="Data Libraries" title="Search Data Libraries in DUOS">
              Institutions, programs, and studies use curated Data Libraries to showcase their science! Check out the options below and contact us to request your own.
            </SectionHead>
            <Grid container className="logo-grid" spacing={{ xs: 2, md: 2.5 }} sx={{ justifyContent: 'center' }}>
              {featuredLibraries.map((library) => {
                const libraryPath = library.key.startsWith('/') ? library.key : `/datalibrary/${library.key}`
                const libraryName = library.title.replace(' Data Library', '')
                const tooltipText = isLogged
                  ? libraryName
                  : `Please login to access ${libraryName} Data Library`
                const isBroad = library.key === 'broad'
                const logoSrc = isBroad ? broadLogo : library.icon ?? undefined

                return (
                  <Grid key={library.key} size={{ xs: 12, sm: 6, md: 4 }} sx={{ maxWidth: { sm: 344 } }}>
                    {/* overflow is visible so the focus ring outside the action area isn't clipped. */}
                    <Card
                      variant="outlined"
                      sx={{ 'height': '100%', 'overflow': 'visible', 'borderColor': color.border, 'borderRadius': '16px', 'boxShadow': shadowSm, ...hoverLift, '&:hover': { boxShadow: shadowLg, borderColor: 'rgba(0, 128, 122, 0.45)' } }}
                    >
                      <Tooltip
                        title={tooltipText}
                        describeChild
                        // The tooltip renders in a portal outside the page wrapper, so it needs its own
                        // reduced-motion rule; it overrides the Grow transition's inline style.
                        slotProps={{ tooltip: { sx: { '@media (prefers-reduced-motion: reduce)': { transition: 'none !important' } } } }}
                      >
                        <CardActionArea
                          component={RouterLink}
                          to={isLogged ? libraryPath : '#'}
                          onClick={(e: React.MouseEvent) => {
                            if (!isLogged) {
                              e.preventDefault()
                              handleSignIn(libraryPath, navigate)
                            }
                          }}
                          sx={{ height: '100%', p: 1.5, borderRadius: 'inherit', ...linkStates(color.ink, color.ink), ...arrowSlide, ...focusRing }}
                        >
                          <Box
                            className="logo-card"
                            // Inline so the Broad logo's dark background doesn't depend on generated styles.
                            style={isBroad ? { background: color.navy, padding: '15px' } : undefined}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: { xs: 124, md: 140 }, p: 2.25, bgcolor: color.surfaceMuted, borderRadius: '10px', overflow: 'hidden' }}
                          >
                            {logoSrc
                              ? <Box component="img" src={logoSrc} alt="" loading="lazy" sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
                              : <Typography aria-hidden="true" sx={{ px: 2, fontSize: '18px', fontWeight: 700, color: color.navy, textAlign: 'center' }}>{libraryName}</Typography>}
                          </Box>
                          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1.5, px: 0.75, pt: 1.5, pb: 0.25 }}>
                            {/* Room for two lines, so a wrapped name doesn't make its row taller than the others. */}
                            <Typography sx={{ display: 'flex', alignItems: 'center', minHeight: '3em', fontSize: '15px', fontWeight: 600, lineHeight: 1.5, color: color.ink, overflowWrap: 'anywhere' }}>{libraryName}</Typography>
                            <ArrowForward className="home-arrow" aria-hidden="true" sx={{ flexShrink: 0, fontSize: '18px', color: accents.teal.main }} />
                          </Stack>
                        </CardActionArea>
                      </Tooltip>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          </HomeSection>

          <HomeSection labelledBy="home-diagram-heading">
            <SectionHead id="home-diagram-heading" eyebrow="How it works" title="How does DUOS expedite compliant data sharing?">
              Researchers use DUOS to share and request access to data, and data access committees
              and institutional officials use DUOS to review and approve research uses of the data.
            </SectionHead>
            <Paper
              variant="outlined"
              sx={{ display: { xs: 'none', sm: 'block' }, px: 3.5, py: 4, borderColor: color.border, borderRadius: '20px', boxShadow: shadowSm }}
            >
              <Box component="img" alt="What is DUOS graphic" src={duosDiagram} sx={{ display: 'block', width: '100%', height: 'auto' }} />
            </Paper>
          </HomeSection>
        </Box>
      </div>
    </main>
  )
}

export default Home
