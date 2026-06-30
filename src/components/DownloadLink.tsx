import React from 'react'
import { kebabCase } from 'src/utils/NodashUtil'
import { Theme } from 'src/libs/theme'

interface DownloadLinkProps {
  label: string
  onDownload: React.MouseEventHandler<HTMLButtonElement>
}

const ICON: React.CSSProperties = {
  color: Theme.palette.link,
  marginRight: '6px',
}

export const DownloadLink = (props: Readonly<DownloadLinkProps>) => {
  const { label, onDownload } = props
  return (
    <div>
      <button id={kebabCase(label)} type="button" onClick={onDownload} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <i className="glyphicon glyphicon-download-alt" style={ICON} />
        <span style={{ fontSize: Theme.font.size.small }}>{label}</span>
      </button>
    </div>
  )
}
