import * as React from 'react'
import { ReactNode } from 'react'
import { getSafeHttpUrl } from 'src/utils/UrlUtils'

export const getDataLocationLink = (dataLocation: string, dataUrl?: string): ReactNode => {
  let dataLocationLink: ReactNode
  const safeDataUrl = getSafeHttpUrl(dataUrl)

  switch (dataLocation) {
    case 'TDR Location':
      dataLocationLink = safeDataUrl
        ? <a href={safeDataUrl} target="_blank" rel="noopener noreferrer">Terra Data Repo</a>
        : 'Terra Data Repo'
      break
    case 'Terra Workspace':
      dataLocationLink = safeDataUrl
        ? <a href={safeDataUrl} target="_blank" rel="noopener noreferrer">Terra Workspace</a>
        : 'Terra Workspace'
      break
    case 'Not Determined':
      dataLocationLink = 'Not Determined'
      break
    default:
      dataLocationLink = safeDataUrl
        ? <a href={safeDataUrl} target="_blank" rel="noopener noreferrer">External to DUOS</a>
        : 'External to DUOS'
  }

  return dataLocationLink
}
