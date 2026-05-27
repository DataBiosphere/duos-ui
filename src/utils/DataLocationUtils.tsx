import * as React from 'react'
import { ReactNode } from 'react'
import { validateHttpUrl } from 'src/utils/UrlUtils'

export const getDataLocationLink = (dataLocation: string, dataUrl?: string): ReactNode => {
  let dataLocationLink: ReactNode
  const validDataUrl = validateHttpUrl(dataUrl)

  switch (dataLocation) {
    case 'TDR Location':
      dataLocationLink = validDataUrl
        ? <a href={validDataUrl} target="_blank" rel="noopener noreferrer">Terra Data Repo</a>
        : 'Terra Data Repo'
      break
    case 'Terra Workspace':
      dataLocationLink = validDataUrl
        ? <a href={validDataUrl} target="_blank" rel="noopener noreferrer">Terra Workspace</a>
        : 'Terra Workspace'
      break
    case 'Not Determined':
      dataLocationLink = 'Not Determined'
      break
    case 'AnVIL Workspace':
      dataLocationLink = validDataUrl
        ? <a href={validDataUrl} target="_blank" rel="noopener noreferrer">AnVIL Workspace</a>
        : 'AnVIL Workspace'
      break
    default:
      dataLocationLink = validDataUrl
        ? <a href={validDataUrl} target="_blank" rel="noopener noreferrer">External to DUOS</a>
        : 'External to DUOS'
  }

  return dataLocationLink
}
