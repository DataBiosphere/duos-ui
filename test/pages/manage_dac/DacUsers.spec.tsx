import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { DacUsers } from 'src/pages/manage_dac/DacUsers'
import type { DacObject } from 'src/types/model'

const dacData = {
  dacId: 1,
  name: 'Test DAC',
  chairpersons: [
    {
      userId: 1,
      email: 'test@broadinstitute.org',
      displayName: 'Chairperson',
      createDate: 1704827256598,
      roles: [{ userId: 1, roleId: 2, name: 'Chairperson', dacId: 1 }],
      emailPreference: true,
    },
  ],
  members: [
    {
      userId: 2,
      email: 'test2@broadinstitute.org',
      displayName: 'Member',
      createDate: 1704827256598,
      roles: [{ userId: 2, roleId: 1, name: 'Member', dacId: 1 }],
      emailPreference: true,
    },
  ],
} as unknown as DacObject

describe('DacUsers Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays DAC members with correct roles', () => {
    const removeHandler = vi.fn()
    render(<DacUsers dac={dacData} removeButton={true} removeHandler={removeHandler} />)

    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText(/Chairperson test@broadinstitute.org/)).toBeInTheDocument()
    expect(screen.getByText('Chairperson', { selector: 'div' })).toBeInTheDocument()
    expect(screen.getByText(/Member test2@broadinstitute.org/)).toBeInTheDocument()
  })

  it('displays remove buttons when removeButton prop is true', () => {
    const removeHandler = vi.fn()
    const { container } = render(<DacUsers dac={dacData} removeButton={true} removeHandler={removeHandler} />)

    const chair = dacData.chairpersons![0]
    const member = dacData.members![0]

    expect(container.querySelector(`[data-cy="remove_button_${chair.userId}"]`)).toBeInTheDocument()
    expect(container.querySelector(`[data-cy="remove_button_${chair.userId}"]`)).toHaveTextContent('Remove')
    expect(container.querySelector(`[data-cy="remove_button_${member.userId}"]`)).toBeInTheDocument()
    expect(container.querySelector(`[data-cy="remove_button_${member.userId}"]`)).toHaveTextContent('Remove')
  })

  it('hides remove buttons when removeButton prop is false', () => {
    const { container } = render(<DacUsers dac={dacData} removeButton={false} removeHandler={() => {}} />)

    const chair = dacData.chairpersons![0]
    const member = dacData.members![0]

    expect(container.querySelector(`[data-cy="remove_button_${chair.userId}"]`)).toBeNull()
    expect(container.querySelector(`[data-cy="remove_button_${member.userId}"]`)).toBeNull()
  })

  it('calls removeHandler when remove button is clicked', () => {
    const removeHandler = vi.fn()
    const { container } = render(<DacUsers dac={dacData} removeButton={true} removeHandler={removeHandler} />)

    const chair = dacData.chairpersons![0]
    const btn = container.querySelector(`[data-cy="remove_button_${chair.userId}"]`) as HTMLElement
    fireEvent.click(btn)

    expect(removeHandler).toHaveBeenCalled()
  })

  it('toggles pending removal state when remove button is clicked twice', () => {
    const removeHandler = vi.fn()
    const { container } = render(<DacUsers dac={dacData} removeButton={true} removeHandler={removeHandler} />)

    const chair = dacData.chairpersons![0]
    const btn = () => container.querySelector(`[data-cy="remove_button_${chair.userId}"]`) as HTMLElement

    fireEvent.click(btn())
    expect(btn()).toHaveTextContent('Pending Removal')

    fireEvent.click(btn())
    expect(btn()).toHaveTextContent('Remove')
  })

  it('applies pending removal styling when marked for removal', () => {
    const removeHandler = vi.fn()
    const { container } = render(<DacUsers dac={dacData} removeButton={true} removeHandler={removeHandler} />)

    const chair = dacData.chairpersons![0]
    const btn = container.querySelector(`[data-cy="remove_button_${chair.userId}"]`) as HTMLElement
    const row = btn.closest('.row') as HTMLElement

    expect(row).not.toHaveStyle({ backgroundColor: 'rgba(211, 211, 211, 0.5)' })

    fireEvent.click(btn)

    expect(row).toHaveStyle({ backgroundColor: 'rgba(211, 211, 211, 0.5)' })
  })

  it('displays all chairpersons and members separately', () => {
    render(<DacUsers dac={dacData} removeButton={true} removeHandler={() => {}} />)

    dacData.chairpersons?.forEach((chair) => {
      expect(screen.getByText(new RegExp(`${chair.displayName}.*${chair.email}`))).toBeInTheDocument()
    })
    expect(screen.getAllByText('Chairperson', { selector: 'div' })).toHaveLength(dacData.chairpersons!.length)

    dacData.members?.forEach((member) => {
      expect(screen.getByText(new RegExp(`${member.displayName}.*${member.email}`))).toBeInTheDocument()
    })
    expect(screen.getAllByText('Member', { selector: 'div' })).toHaveLength(dacData.members!.length)
  })

  it('handles multiple user removals independently', () => {
    const removeHandler = vi.fn()
    const { container } = render(<DacUsers dac={dacData} removeButton={true} removeHandler={removeHandler} />)

    const chair = dacData.chairpersons![0]
    const member = dacData.members![0]

    const chairBtn = () => container.querySelector(`[data-cy="remove_button_${chair.userId}"]`) as HTMLElement
    const memberBtn = () => container.querySelector(`[data-cy="remove_button_${member.userId}"]`) as HTMLElement

    fireEvent.click(chairBtn())
    expect(chairBtn()).toHaveTextContent('Pending Removal')
    expect(memberBtn()).toHaveTextContent('Remove')

    fireEvent.click(memberBtn())
    expect(memberBtn()).toHaveTextContent('Pending Removal')
    expect(chairBtn()).toHaveTextContent('Pending Removal')
  })

  it('displays user emails along with display names', () => {
    render(<DacUsers dac={dacData} removeButton={false} />)
    const chair = dacData.chairpersons![0]
    expect(screen.getByText(`${chair.displayName} ${chair.email}`)).toBeInTheDocument()
  })

  it('renders only headers when members and chairpersons are empty', () => {
    const emptyDac = { ...dacData, chairpersons: [], members: [] } as unknown as DacObject
    render(<DacUsers dac={emptyDac} removeButton={true} removeHandler={() => {}} />)

    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
  })

  it('displays correct role labels for chairpersons and members', () => {
    render(<DacUsers dac={dacData} removeButton={false} />)

    expect(screen.getByText('Chairperson', { selector: 'div' })).toBeInTheDocument()
    expect(screen.getByText('Member', { selector: 'div' })).toBeInTheDocument()
  })
})
