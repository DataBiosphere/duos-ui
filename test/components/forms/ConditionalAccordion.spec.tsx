import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { ConditionalAccordion } from 'src/components/forms/ConditionalAccordion'

const renderAccordion = (condition: boolean) =>
  render(
    <BrowserRouter>
      <ConditionalAccordion condition={condition} title="hello world">
        <div><h1>Child component</h1></div>
      </ConditionalAccordion>
    </BrowserRouter>,
  )

describe('ConditionalAccordion', () => {
  it('renders an accordion with children when condition is true', () => {
    renderAccordion(true)
    expect(screen.getByRole('button', { name: 'hello world' })).toBeInTheDocument()
    expect(screen.getByText('Child component')).toBeInTheDocument()
    expect(screen.getByTestId('ExpandMoreIcon')).toBeInTheDocument()
  })

  it('renders children without accordion when condition is false', () => {
    renderAccordion(false)
    expect(screen.getByRole('heading', { level: 2, name: 'hello world' })).toBeInTheDocument()
    expect(screen.getByText('Child component')).toBeInTheDocument()
    expect(screen.queryByTestId('ExpandMoreIcon')).not.toBeInTheDocument()
  })
})
