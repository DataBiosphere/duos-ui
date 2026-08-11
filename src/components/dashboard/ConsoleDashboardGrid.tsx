import React from 'react'
import { Link } from 'react-router'
import { Box, Card, Typography } from '@mui/material'
import { useNavigationState } from 'src/contexts/NavigationStateContext'
import {
  cardIconStyle,
  cardStyle,
  cardTitleStyle,
  descriptionStyle,
  gridStyle,
  statLabelStyle,
  statStyle,
  statsStyle,
  statValueStyle,
} from './dashboardStyles'

export interface ConsoleDashboardStat {
  label: string
  /** `null` renders the placeholder. */
  value: number | null
}

export interface ConsoleDashboardTile {
  label: string
  link: string
  icon: React.ComponentType
  description: string
  stats: ConsoleDashboardStat[]
}

interface ConsoleDashboardGridProps {
  tiles: ConsoleDashboardTile[]
  /** Separates "still loading" from "backend could not supply it" in the accessible name. */
  isLoading: boolean
}

export default function ConsoleDashboardGrid({ tiles, isLoading }: Readonly<ConsoleDashboardGridProps>): React.JSX.Element {
  // Tiles leave the console's own tab, so they carry the tab context that keeps it highlighted.
  const { activeTab } = useNavigationState()

  return (
    <Box sx={gridStyle}>
      {tiles.map((tile) => {
        const Icon = tile.icon
        return (
          <Card
            variant="outlined"
            key={tile.link}
            component={Link}
            to={tile.link}
            state={{ selectedMenuTab: activeTab }}
            sx={cardStyle}
          >
            <Box component="span" sx={cardIconStyle}><Icon /></Box>
            <span>
              <Typography component="span" sx={cardTitleStyle}>{tile.label}</Typography>
              <Typography component="span" sx={descriptionStyle}>{tile.description}</Typography>
              <Box component="span" sx={statsStyle}>
                {tile.stats.map((stat) => {
                  // The en-dash alone tells a screen reader nothing, so the accessible name
                  // spells out the label and either the count or why it is missing.
                  // Nullish, not `!== null`: the visible text falls back with `??`, so testing
                  // only for `null` would announce "undefined" over a tile reading "–".
                  const value = isLoading ? null : stat.value
                  let valueDescription: string
                  if (value != null) {
                    valueDescription = `${value}`
                  }
                  else if (isLoading) {
                    valueDescription = 'loading'
                  }
                  else {
                    valueDescription = 'unavailable'
                  }
                  return (
                    <Box component="span" key={stat.label} sx={statStyle}>
                      <Typography
                        component="span"
                        sx={statValueStyle}
                        aria-label={`${stat.label}: ${valueDescription}`}
                      >
                        {value ?? '–'}
                      </Typography>
                      <Typography component="span" sx={statLabelStyle} aria-hidden="true">{stat.label}</Typography>
                    </Box>
                  )
                })}
              </Box>
            </span>
          </Card>
        )
      })}
    </Box>
  )
}
