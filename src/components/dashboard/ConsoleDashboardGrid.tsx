import React from 'react'
import { Link } from 'react-router-dom'

export interface ConsoleDashboardTileMeta {
  icon: React.ComponentType
  description: string
  statLabels: string[]
}

export interface ConsoleDashboardTile {
  label: string
  link: string
}

interface ConsoleDashboardGridProps {
  tiles: ConsoleDashboardTile[]
  tileMetaByLink: Record<string, ConsoleDashboardTileMeta>
  statValuesByLink: Record<string, Record<string, number>>
  isLoading: boolean
}

export default function ConsoleDashboardGrid({
  tiles,
  tileMetaByLink,
  statValuesByLink,
  isLoading,
}: ConsoleDashboardGridProps): React.JSX.Element {
  return (
    <>
      <style>
        {`
        .console-dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.5rem;
          max-width: 900px;
          margin: 2rem auto;
        }
        .console-dashboard-tile {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: #ffffff;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          padding: 1.75rem;
          box-sizing: border-box;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .console-dashboard-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.13);
          border-color: rgba(0, 0, 0, 0.18);
        }
        .console-dashboard-tile-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(0, 96, 159, 0.08);
          color: #00609f;
          flex-shrink: 0;
        }
        .console-dashboard-tile-label {
          font-family: Montserrat, sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #1F3B50;
          margin: 0 0 0.35rem;
        }
        .console-dashboard-tile-description {
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }
        .console-dashboard-tile-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-top: 1rem;
        }
        .console-dashboard-stat {
          display: flex;
          flex-direction: column;
        }
        .console-dashboard-stat-value {
          font-family: Montserrat, sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #00609f;
        }
        .console-dashboard-stat-label {
          font-family: Montserrat, sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        @media (max-width: 600px) {
          .console-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        `}
      </style>
      <div className="console-dashboard-grid">
        {tiles.map((tile) => {
          const meta = tileMetaByLink[tile.link]
          const Icon = meta?.icon
          const statLabels = meta?.statLabels ?? []
          const values = statValuesByLink[tile.link] ?? {}
          return (
            <Link key={tile.link} to={tile.link} className="console-dashboard-tile">
              {Icon && (
                <span className="console-dashboard-tile-icon-wrap">
                  <Icon />
                </span>
              )}
              <span>
                <p className="console-dashboard-tile-label">{tile.label}</p>
                {meta?.description && (
                  <p className="console-dashboard-tile-description">{meta.description}</p>
                )}
                {statLabels.length > 0 && (
                  <div className="console-dashboard-tile-stats">
                    {statLabels.map(label => (
                      <div key={label} className="console-dashboard-stat">
                        <span className="console-dashboard-stat-value">{isLoading ? '–' : (values[label] ?? '–')}</span>
                        <span className="console-dashboard-stat-label">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
