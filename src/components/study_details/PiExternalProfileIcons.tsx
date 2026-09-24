import React from 'react'
import { IconButton } from '@mui/material'
import { Link as LinkIcon, Language } from '@mui/icons-material'
import { PiProfileLink, PiProfileLinkKind } from './piProfileLinks'

const ICONS: Record<PiProfileLinkKind, React.ReactNode> = {
  orcid: <span style={{ fontSize: 12, fontWeight: 700 }}>iD</span>,
  linkedin: <LinkIcon fontSize="small" />,
  website: <Language fontSize="small" />,
}

const PiExternalProfileIcons = ({ links }: { links: PiProfileLink[] }) => (
  <span>
    {links.map(({ href, label, kind, field }) => (
      <IconButton
        // Keyed by the field it came from: one link per field, so this is unique. Neither href
        // nor label is - the same URL can be typed into two fields, and a demoted link takes the
        // generic website label.
        key={field}
        size="small"
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
      >
        {ICONS[kind]}
      </IconButton>
    ))}
  </span>
)

export default PiExternalProfileIcons
