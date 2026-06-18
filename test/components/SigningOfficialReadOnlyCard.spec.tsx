import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SigningOfficialReadOnlyCard from 'src/components/SigningOfficialReadOnlyCard'

describe('SigningOfficialReadOnlyCard', () => {
  const baseProps = {
    name: 'Jane Smith',
    email: 'jane.smith@broad.mit.edu',
  }

  it('renders name and email', () => {
    render(<SigningOfficialReadOnlyCard {...baseProps} />)
    expect(screen.getByText('Jane Smith')).toBeTruthy()
    expect(screen.getByText('jane.smith@broad.mit.edu')).toBeTruthy()
  })

  it('renders email as a mailto link', () => {
    render(<SigningOfficialReadOnlyCard {...baseProps} />)
    const link = screen.getByRole('link', { name: /Email Jane Smith/ })
    expect(link.getAttribute('href')).toBe('mailto:jane.smith@broad.mit.edu')
  })

  it('renders institution name when provided', () => {
    render(<SigningOfficialReadOnlyCard {...baseProps} institutionName="Broad Institute" />)
    expect(screen.getByText('Broad Institute')).toBeTruthy()
  })

  it('does not render institution row when institutionName is absent', () => {
    render(<SigningOfficialReadOnlyCard {...baseProps} />)
    expect(screen.queryByText('Institution')).toBeNull()
  })

  it('does not render external profiles section when no profiles present', () => {
    render(<SigningOfficialReadOnlyCard {...baseProps} />)
    expect(screen.queryByText('External Profile')).toBeNull()
  })

  it('renders LinkedIn as a clickable link', () => {
    render(
      <SigningOfficialReadOnlyCard
        {...baseProps}
        externalProfiles={{ linkedIn: 'janesmith' }}
      />,
    )
    const link = screen.getByRole('link', { name: /LinkedIn/ })
    expect(link.getAttribute('href')).toBe('https://www.linkedin.com/in/janesmith')
  })

  it('renders ORCID as a clickable link', () => {
    render(
      <SigningOfficialReadOnlyCard
        {...baseProps}
        externalProfiles={{ ORCID: '0000-0002-1825-0097' }}
      />,
    )
    const link = screen.getByRole('link', { name: /ORCID/ })
    expect(link.getAttribute('href')).toBe('https://orcid.org/0000-0002-1825-0097')
  })

  it('renders Through.bio as a clickable link', () => {
    render(
      <SigningOfficialReadOnlyCard
        {...baseProps}
        externalProfiles={{ throughBio: 'janesmith' }}
      />,
    )
    const link = screen.getByRole('link', { name: /Through\.bio/ })
    expect(link.getAttribute('href')).toBe('https://through.bio/janesmith')
  })

  it('renders institutional website as a clickable link', () => {
    render(
      <SigningOfficialReadOnlyCard
        {...baseProps}
        externalProfiles={{ institutionalWebsite: 'https://broad.mit.edu' }}
      />,
    )
    const link = screen.getByRole('link', { name: /Institutional Website/ })
    expect(link.getAttribute('href')).toBe('https://broad.mit.edu')
  })

  it('renders institutional website as plain text when URL is invalid', () => {
    render(
      <SigningOfficialReadOnlyCard
        {...baseProps}
        externalProfiles={{ institutionalWebsite: 'not-a-url' }}
      />,
    )
    expect(screen.getByText('not-a-url')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Institutional Website/ })).toBeNull()
  })

  it('only renders external profile entries that are present', () => {
    render(
      <SigningOfficialReadOnlyCard
        {...baseProps}
        externalProfiles={{ linkedIn: 'janesmith' }}
      />,
    )
    expect(screen.queryByText('ORCID iD')).toBeNull()
    expect(screen.queryByText('Through.bio')).toBeNull()
    expect(screen.queryByText('Institutional Website')).toBeNull()
    expect(screen.getByText('LinkedIn')).toBeTruthy()
  })

  it('has an accessible section label including the SO name', () => {
    const { container } = render(<SigningOfficialReadOnlyCard {...baseProps} />)
    const section = container.querySelector('section')
    expect(section?.getAttribute('aria-label')).toBe('Signing Official: Jane Smith')
  })
})
