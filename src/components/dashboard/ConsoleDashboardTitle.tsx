import React from 'react'

interface ConsoleDashboardTitleProps {
  children: React.ReactNode
}

export default function ConsoleDashboardTitle({ children }: ConsoleDashboardTitleProps): React.JSX.Element {
  return (
    <>
      <style>
        {`
        .console-dashboard-title {
          font-family: Montserrat, sans-serif;
          font-weight: 600;
          font-size: 2.8rem;
          color: #1F3B50;
          max-width: 900px;
          margin: 2rem auto 0;
        }
        `}
      </style>
      <h1 className="console-dashboard-title">{children}</h1>
    </>
  )
}
