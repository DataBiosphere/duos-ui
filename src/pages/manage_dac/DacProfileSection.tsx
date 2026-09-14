import React, { useId } from 'react'

interface DacProfileSectionProps {
  title: string
  children?: React.ReactNode
}

export const DacProfileSection: React.FC<DacProfileSectionProps> = ({ title, children }) => {
  const headingId = useId()

  return (
    <section className="profile-card" aria-labelledby={headingId}>
      <h1 id={headingId} className="profile-card-heading">{title}</h1>
      {children}
    </section>
  )
}
