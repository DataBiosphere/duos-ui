import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import {
  usernameCellData,
  emailCellData,
  permissionsCellData,
  institutionCellData,
} from 'src/components/manage_users_table/ManageUsersTableCellData'
import { UserRole, LibraryCard, InstitutionInterface } from 'src/types/model'

const makeRole = (name: UserRole['name'], userId = 1): UserRole => ({
  roleId: 1,
  name,
  userId,
  userRoleId: 1,
})

const makeLibraryCard = (): LibraryCard => ({
  id: 1,
  userId: 1,
  userName: 'Alice',
  userEmail: 'alice@test.com',
  createUserId: 1,
  createDate: new Date(),
})

describe('usernameCellData', () => {
  it('returns the display name as value and correct id', () => {
    const result = usernameCellData({ displayName: 'Alice Smith', userId: 42 })
    expect(result.value).toBe('Alice Smith')
    expect(result.id).toBe(42)
    expect(result.label).toBe('user-name')
  })

  it('accepts a custom label', () => {
    const result = usernameCellData({ displayName: 'Alice', userId: 1, label: 'custom-label' })
    expect(result.label).toBe('custom-label')
  })

  it('renders a link to the user edit page with the display name', () => {
    const result = usernameCellData({ displayName: 'Alice Smith', userId: 42 })
    render(<BrowserRouter>{result.data as React.ReactElement}</BrowserRouter>)
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/admin_edit_user/42')
  })
})

describe('emailCellData', () => {
  it('returns email as both data and value', () => {
    const result = emailCellData({ userId: 1, email: 'alice@test.com' })
    expect(result.data).toBe('alice@test.com')
    expect(result.value).toBe('alice@test.com')
    expect(result.id).toBe(1)
    expect(result.label).toBe('email')
  })

  it('accepts a custom label', () => {
    const result = emailCellData({ userId: 1, email: 'alice@test.com', label: 'custom-email' })
    expect(result.label).toBe('custom-email')
  })
})

describe('permissionsCellData', () => {
  it('shows None when no roles and no library card', () => {
    const result = permissionsCellData({ userId: 1, roles: [] })
    expect(result.data).toBe('None')
    expect(result.id).toBe(1)
    expect(result.label).toBe('permissions')
    expect(result.isComponent).toBe(true)
  })

  it('filters out the Researcher role', () => {
    const result = permissionsCellData({
      userId: 1,
      roles: [makeRole('Researcher'), makeRole('Admin')],
    })
    expect(result.data).toContain('Admin')
    expect(result.data).not.toContain('Researcher')
  })

  it('formats role names by inserting spaces before uppercase letters', () => {
    const result = permissionsCellData({
      userId: 1,
      roles: [makeRole('SigningOfficial')],
    })
    expect(result.data).toContain('Signing Official')
  })

  it('appends Library Card when a library card is present', () => {
    const result = permissionsCellData({
      userId: 1,
      roles: [],
      libraryCard: makeLibraryCard(),
    })
    expect(result.data).toContain('Library Card')
  })

  it('shows None when Researcher is the only role and no library card', () => {
    const result = permissionsCellData({
      userId: 1,
      roles: [makeRole('Researcher')],
    })
    expect(result.data).toBe('None')
  })

  it('accepts a custom label', () => {
    const result = permissionsCellData({ userId: 1, roles: [], label: 'custom-perms' })
    expect(result.label).toBe('custom-perms')
  })
})

describe('institutionCellData', () => {
  it('returns the institution name when institution is provided', () => {
    const institution = { id: 1, name: 'Test University' } as unknown as InstitutionInterface
    const result = institutionCellData({ userId: 1, institution })
    expect(result.data).toBe('Test University')
    expect(result.id).toBe(1)
    expect(result.label).toBe('insitution')
    expect(result.isComponent).toBe(true)
  })

  it('returns N/A when institution is undefined', () => {
    const result = institutionCellData({ userId: 1 })
    expect(result.data).toBe('N/A')
  })

  it('accepts a custom label', () => {
    const result = institutionCellData({ userId: 1, label: 'custom-inst' })
    expect(result.label).toBe('custom-inst')
  })
})
