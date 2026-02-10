import React from 'react'

import { Box, Menu, MenuItem, PopoverOrigin, Typography } from '@mui/material'
import { DuosUser } from 'src/types/model'
import { Link } from 'react-router-dom'

interface ProfileLinksProps {
  currentUser: DuosUser
  onSubtabChange: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, newValue: number) => void
  signOut: () => void
  orientation: 'horizontal' | 'vertical'
  menuWidth?: number | string
}

export const ProfileLinks: React.FC<ProfileLinksProps> = (props) => {
  const { currentUser, onSubtabChange, signOut, orientation, menuWidth } = props
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
