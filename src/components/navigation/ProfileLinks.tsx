import React from 'react'

import { Box, Menu, MenuItem, PopoverOrigin, Typography } from '@mui/material'
import { DuosUser } from 'src/types/model'
import { Link } from 'react-router'
import { useSessionInfo } from 'src/hooks/useSession'
import type { SessionInfo } from 'src/libs/auth/session'

// Keyed off the SessionInfo union so adding a provider without a label (or
// typo-ing one) is a compile error.
const IDP_LABELS = {
  google: 'Google',
  microsoft: 'Microsoft',
} satisfies Record<NonNullable<SessionInfo['idp']>, string>

interface ProfileLinksProps {
  currentUser: DuosUser
  onSubtabChange: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, newValue: number) => void
  signOut: () => void
  orientation: 'horizontal' | 'vertical'
  menuWidth?: number | string
}

export const ProfileLinks: React.FC<ProfileLinksProps> = (props) => {
  const { currentUser, onSubtabChange, signOut, orientation, menuWidth } = props
  // /auth/me reports which sub-provider (Google or Microsoft) the user chose
  // on the B2C login page — display only, nothing sensitive is stored.
  const idp = useSessionInfo()?.idp
  const idpLabel = idp ? IDP_LABELS[idp] : undefined
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null)
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget)
  }
  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

  // Stylistic adjustments to position the menu correctly based on orientation
  const leftMargin = 0
  const topMargin = orientation === 'horizontal' ? 7 : -5

  const origin: PopoverOrigin = orientation === 'horizontal'
    ? { vertical: 'top', horizontal: 'left' }
    : { vertical: 'bottom', horizontal: 'left' }

  return (
    <Box sx={{
      p: '5px',
      flexGrow: 0,
      minWidth: menuWidth,
    }}
    >
      <Typography
        id="sel_user"
        onClick={handleOpenUserMenu}
        sx={[
          {
            '&:hover': {
              color: 'primary.main',
            },
          },
          {
            cursor: 'pointer',
            fontSize: 14,
            color: 'white',
            textAlign: 'right',
          },
        ]}
      >
        <span>{currentUser.displayName}<span className="caret caret-margin" /></span>
        <span style={{ fontSize: 12 }}>{currentUser.email}</span>
      </Typography>
      <Menu
        sx={{
          'ml': leftMargin,
          'mt': topMargin,
          '& .MuiPaper-root': {
            width: menuWidth,
          },
        }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={origin}
        keepMounted
        transformOrigin={origin}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        {idpLabel && (
          <MenuItem key="idp" disabled sx={{ opacity: 1 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Signed in with {idpLabel}
            </Typography>
          </MenuItem>
        )}
        <MenuItem key="profile" onClick={handleCloseUserMenu}>
          <Typography sx={{ fontSize: 12 }}>
            <Link id="link_profile" to="/profile" onClick={e => onSubtabChange(e, 0)}>Your Profile</Link>
          </Typography>
        </MenuItem>
        <MenuItem key="sign-out" onClick={handleCloseUserMenu}>
          <Typography sx={{ color: '#337ab7', fontSize: 12 }} onClick={signOut}>
            Sign out
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  )
}
