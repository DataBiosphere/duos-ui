import * as React from 'react'
import { useEffect, useState } from 'react'
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { Config } from 'src/libs/config'
import { SnapshotSummaryModel } from 'src/types/tdrModel'
import terraLogo from 'src/images/terra-logo.svg'

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

  if (snapshots.length === 0) return null

  const snapshot = snapshots[0]
  const terraLink = `${terraUrl}/#import-data?snapshotId=${snapshot.id}&format=tdrexport&tdrSyncPermissions=false`

  return (
    <>
      <Button
        size="small"
        variant="text"
        endIcon={<ArrowDropDownIcon />}
        onClick={e => setAnchorEl(e.currentTarget)}
        aria-label="Export to..."
        sx={{ marginRight: '5px', textTransform: 'none', padding: '0 4px 0 0', minWidth: 0, fontSize: 'inherit', lineHeight: 'inherit' }}
      >
        Export to...
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          component="a"
          href={terraLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAnchorEl(null)}
          title={`Export snapshot ${snapshot.name} to Terra`}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Box component="img" src={terraLogo} alt="" sx={{ width: 32, height: 32 }} />
          </ListItemIcon>
          <ListItemText>Terra</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

export default DatasetExportButton
