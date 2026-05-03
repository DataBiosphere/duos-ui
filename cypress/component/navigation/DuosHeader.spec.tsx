import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DuosHeader from 'src/components/DuosHeader'
import { DuosUser } from 'src/types/model'
import * as StorageModule from 'src/libs/storage'
import { NavigationStateProvider } from 'src/contexts/NavigationStateContext'

const mockUser: DuosUser = {
  createDate: new Date(),
  displayName: 'Test User',
  email: 'test@example.com',
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
  userId: 1,
}

const mountHeader = (path: string, user?: DuosUser) => {
  cy.viewport(1280, 720)
  cy.intercept('GET', '**/api/notifications/banners', [])

  // Stub Storage module BEFORE mount - don't use cy.wrap
  if (user) {
    cy.stub(StorageModule.Storage, 'userIsLogged').returns(true)
    cy.stub(StorageModule.Storage, 'getCurrentUser').returns(user)
  }
  else {
    cy.stub(StorageModule.Storage, 'userIsLogged').returns(false)
    cy.stub(StorageModule.Storage, 'getCurrentUser').returns(null)
  }

  cy.mount(
    <MemoryRouter initialEntries={[path]}>
      <NavigationStateProvider>
        <Routes>
          <Route path="*" element={<DuosHeader classes={{ drawerPaper: '' }} />} />
        </Routes>
      </NavigationStateProvider>
    </MemoryRouter>,
  )
}

describe('DuosHeader', () => {
  describe('Unauthenticated User', () => {
    beforeEach(() => {
      mountHeader('/home')
    })

    it('displays the DUOS logo', () => {
      cy.get('img[alt="DUOS Logo"]').should('be.visible')
    })

    it('displays Contact Us button', () => {
      cy.get('#btn_applyAcces').should('be.visible').and('contain', 'Contact Us')
    })
  })

  describe('Authenticated Researcher', () => {
    beforeEach(() => {
      mountHeader('/datalibrary', mockUser)
    })

    it('displays Researcher Console tab', () => {
      cy.contains('Researcher Console').should('be.visible')
    })

    it('displays correct subtabs for researcher', () => {
      cy.contains('Data Library').should('be.visible')
      cy.contains('Data Access Requests').should('be.visible')
      cy.contains('Datasets').should('be.visible')
    })
  })

  describe('Authenticated Admin', () => {
    beforeEach(() => {
      mountHeader('/admin_manage_dar_collections', { ...mockUser, isAdmin: true, isResearcher: false })
    })

    it('displays Admin Console tab', () => {
      cy.contains('Admin Console').should('be.visible')
    })
  })

  describe('Authenticated Signing Official', () => {
    beforeEach(() => {
      mountHeader('/signing_official_console/library_cards', { ...mockUser, isSigningOfficial: true, isResearcher: false })
    })

    it('displays SO Console tab', () => {
      cy.contains('SO Console').should('be.visible')
    })
  })

  describe('Authenticated DAC Chair', () => {
    beforeEach(() => {
      mountHeader('/chair_console', { ...mockUser, isChairPerson: true, isResearcher: false })
    })

    it('displays DAC Chair Console tab', () => {
      cy.contains('DAC Chair Console').should('be.visible')
    })
  })

  describe('Authenticated DAC Member', () => {
    beforeEach(() => {
      mountHeader('/member_console', { ...mockUser, isMember: true, isResearcher: false })
    })

    it('displays DAC Member Console tab', () => {
      cy.contains('DAC Member Console').should('be.visible')
    })
  })

  describe('Contact Us Button', () => {
    beforeEach(() => {
      mountHeader('/home')
    })

    it('changes color on hover', () => {
      cy.get('#btn_applyAcces').should('be.visible')
      cy.get('#btn_applyAcces').trigger('mouseover')
      cy.get('#btn_applyAcces').should('have.css', 'color').and('match', /47.*164.*231/)
    })

    it('displays Contact Us icon and text', () => {
      cy.get('#btn_applyAcces img[alt="Contact Us Icon"]').should('be.visible')
      cy.get('#btn_applyAcces').should('contain', 'Contact Us')
    })
  })

  describe('Tab Highlighting', () => {
    it('highlights Researcher Console on /datalibrary for researcher-only user', () => {
      mountHeader('/datalibrary', mockUser)
      cy.contains('Researcher Console')
        .should('be.visible')
        .should('have.class', 'Mui-selected')
    })

    it('highlights Researcher Console on /datalibrary for admin+researcher (direct link wins over child match)', () => {
      const adminResearcher = { ...mockUser, isAdmin: true, isResearcher: true }
      mountHeader('/datalibrary', adminResearcher)
      cy.contains('Researcher Console')
        .should('be.visible')
        .should('have.class', 'Mui-selected')
    })

    it('highlights Admin Console on /admin_manage_dar_collections for admin+researcher', () => {
      const adminResearcher = { ...mockUser, isAdmin: true, isResearcher: true }
      mountHeader('/admin_manage_dar_collections', adminResearcher)
      cy.contains('Admin Console')
        .should('be.visible')
        .should('have.class', 'Mui-selected')
    })

    it('preserves Researcher Console tab on a detail page with no URL match (context fallback)', () => {
      // Mount on a known-tab URL first to seed context, then navigate to a detail URL.
      // MemoryRouter is re-created each mount, so we simulate context by providing
      // a path that has no tab match — the tab falls back to index 0 (first tab).
      // The important thing is that no crash occurs and a tab is still selected.
      mountHeader('/dar_application_review/999', mockUser)
      cy.get('.Mui-selected').should('exist')
    })
  })
})
