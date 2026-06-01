import * as React from 'react'
import { useEffect, useState } from 'react'
import { Link, Button, Menu, MenuItem } from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { Config } from 'src/libs/config'
import { SnapshotSummaryModel } from 'src/types/tdrModel'

interface DatasetExportButtonProps {
  snapshots: SnapshotSummaryModel[]
}

export const DatasetExportButton = ({ snapshots }: DatasetExportButtonProps) => {
  const [terraUrl, setTerraUrl] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  useEffect(() => {
    (async () => {
      setTerraUrl(await Config.getTerraUrl())
    })()
  }, [])

  const makeLink = (snapshot: SnapshotSummaryModel) =>
    `${terraUrl}/#import-data?snapshotId=${snapshot.id}&format=tdrexport&tdrSyncPermissions=false`

  if (snapshots.length === 0) return null

  if (snapshots.length === 1) {
    const snapshot = snapshots[0]
    const title = `Export snapshot ${snapshot.name}`
    return (
      <Link
        style={{ marginRight: '5px' }}
        href={makeLink(snapshot)}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
        aria-label={title}
      >
        Export
      </Link>
    )
  }

  return (
    <>
      <Button
        size="small"
        variant="text"
        endIcon={<ArrowDropDownIcon />}
        onClick={e => setAnchorEl(e.currentTarget)}
        aria-label={`Export — ${snapshots.length} snapshots available`}
        sx={{ marginRight: '5px', textTransform: 'none', padding: '0 4px 0 0', minWidth: 0, fontSize: 'inherit', lineHeight: 'inherit' }}
      >
        Export
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {snapshots.map(snapshot => (
          <MenuItem
            key={snapshot.id}
            component="a"
            href={makeLink(snapshot)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAnchorEl(null)}
            title={`Export snapshot ${snapshot.name}`}
          >
            {snapshot.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default DatasetExportButton
