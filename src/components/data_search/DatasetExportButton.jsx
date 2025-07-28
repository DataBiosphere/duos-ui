import * as React from 'react'
import { useEffect, useState } from 'react'
import { Link } from '@mui/material'
import { Config } from '../../libs/config'

export const DatasetExportButton = (props) => {
  const { snapshot, title } = props

  const [terraUrl, setTerraUrl] = useState('')

  useEffect(() => {
    (async () => {
      setTerraUrl(await Config.getTerraUrl())
    })()
  }, [])

  const link = `${terraUrl}/#import-data?snapshotId=${snapshot.id}&format=tdrexport&tdrSyncPermissions=false`

  return <Link style={{ marginRight: '5px' }} href={link} target="_blank" rel="noopener noreferrer" title={title} aria-label={title}>Export</Link>
}

export default DatasetExportButton
