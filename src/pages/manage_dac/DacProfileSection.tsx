import React, { useId } from 'react'

interface DacProfileSectionProps {
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}

export const DacProfileSection: React.FC<DacProfileSectionProps> = ({ title, description, children }) => {
  const headingId = useId()

  return (
    <section className="profile-card" aria-labelledby={headingId}>
      <h1 id={headingId} className="profile-card-heading">{title}</h1>
      {description && <p className="profile-card-description">{description}</p>}
      {children}
    </section>
  )
}
