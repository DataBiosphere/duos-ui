import React, { useId } from 'react'

interface DacProfileSectionProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export const DacProfileSection: React.FC<DacProfileSectionProps> = ({ title, description, children }) => {
  const headingId = useId()
  const descriptionId = useId()

  return (
    <section className="profile-card" aria-labelledby={headingId} aria-describedby={description ? descriptionId : undefined}>
      <h1 id={headingId} className="profile-card-heading">{title}</h1>
      {description && <p id={descriptionId} className="profile-card-description">{description}</p>}
      {children}
    </section>
  )
}
