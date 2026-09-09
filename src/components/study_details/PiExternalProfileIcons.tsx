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
    {links.map(({ href, label, kind }) => (
      <IconButton
        key={label}
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
