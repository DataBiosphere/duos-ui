import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SigningOfficialsList } from 'src/components/institution_table/components/SigningOfficialsList'
import { SimplifiedDuosUser } from 'src/types/model'

describe('Signing Officials List Tests', () => {
  const testSigningOfficials: SimplifiedDuosUser[] = [
    {
      userId: 1,
      displayName: 'John Doe',
      email: 'john.doe@example.com',
    },
    {
      userId: 2,
      displayName: 'Jane Smith',
      email: 'jane.smith@example.org',
    },
  ]

  it('should render the signing officials list', () => {
    const { container } = render(
      <BrowserRouter>
        <SigningOfficialsList signingOfficials={testSigningOfficials} />
      </BrowserRouter>,
    )

    expect(screen.getByText('Signing Officials')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Administrators can manage Signing Officials from the/,
      ),
    ).toBeInTheDocument()

    const inputs = container.querySelectorAll('input')
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('readonly')
      expect(input).toBeDisabled()
    })
  })

  it('should show message when no signing officials', () => {
    render(
      <BrowserRouter>
        <SigningOfficialsList signingOfficials={[]} />
      </BrowserRouter>,
    )

    expect(
      screen.getByText('This institution does not have any Signing Officials'),
    ).toBeInTheDocument()
  })

  it('should display correct signing official information', () => {
    const { container } = render(
      <BrowserRouter>
        <SigningOfficialsList signingOfficials={testSigningOfficials} />
      </BrowserRouter>,
    )

    expect(container.querySelector('input[value="John Doe"]')).toBeInTheDocument()
    expect(container.querySelector('input[value="john.doe@example.com"]')).toBeInTheDocument()

    expect(container.querySelector('input[value="Jane Smith"]')).toBeInTheDocument()
    expect(container.querySelector('input[value="jane.smith@example.org"]')).toBeInTheDocument()
  })
})
