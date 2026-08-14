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
      // Strip trailing slashes before the value reaches makeTerraLink's
      // `${terraUrl}/#import-data?…` concatenation. The BFF normalizes its
      // DUOS_TERRA_URL override the same way, but a static config.json value
      // (legacy environments, hand-edited local configs) doesn't pass through
      // that path — and a bare-slashes value must collapse to '' and hide the
      // links below rather than produce hrefs with an empty base.
      let url = (await Config.getTerraUrl()) ?? ''
      while (url.endsWith('/')) {
        url = url.slice(0, -1)
      }
      setTerraUrl(url)
    })()
  }, [])

  // No terraUrl means this environment has no Terra to export to (BEEs define
  // neither the static config value nor DUOS_TERRA_URL) — hide the links
  // rather than render them with an empty base.
  if (snapshots.length === 0 || terraUrl === '') return null

  const makeTerraLink = (snapshot: SnapshotSummaryModel) =>
    `${terraUrl}/#import-data?snapshotId=${snapshot.id}&format=tdrexport&tdrSyncPermissions=false`

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
        {snapshots.map(snapshot => (
          <MenuItem
            key={snapshot.id}
            component="a"
            href={makeTerraLink(snapshot)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAnchorEl(null)}
            title={`Export snapshot ${snapshot.name} to Terra`}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box component="img" src={terraLogo} alt="" sx={{ width: 32, height: 32 }} />
            </ListItemIcon>
            <ListItemText primary="Terra" secondary={snapshot.name} />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default DatasetExportButton
