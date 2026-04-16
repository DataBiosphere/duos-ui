import React from 'react'
import { mount } from 'cypress/react'
import DataAccessRequestApplication from 'src/pages/dar_application/DataAccessRequestApplication'
import { DAR } from 'src/libs/ajax/DAR'
import { DAA } from 'src/libs/ajax/DAA'
import { DAAUtils } from 'src/utils/DAAUtils'
import { Storage } from 'src/libs/storage'
import { User } from 'src/libs/ajax/User'
import { Collections } from 'src/libs/ajax/Collections'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Countries } from 'src/libs/ajax/Countries'
import { NotificationService } from 'src/libs/notificationService'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Metrics } from 'src/libs/ajax/Metrics'
import darCollection from './DataAccessRequest/darCollection.json'

const user = {
  userId: 5,
  displayName: 'Jane Doe',
  email: 'janedoe@gmail.com',
  eraCommonsId: 'asdg',
  libraryCard: {},
  properties: [
    {
      propertyId: 10350,
      userId: 5,
      propertyKey: 'eraAuthorized',
      propertyValue: 'true',
    },
    {
      propertyId: 10351,
      userId: 5,
      propertyKey: 'eraExpiration',
      propertyValue: '999980741397751',
    },
  ],
}

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: `DUOS-123456`,
    name: 'Some Dataset',
    dacId: 1,
    dataUse: {},
  },
]

const userSigningOfficials = [
  {
    userId: 6,
    displayName: 'SO 1',
    email: 'so1@gmail.com',
  },
]

describe('DataAccessRequestApplication', () => {
  it('shows spinner when submitting', () => {
    // Mocks
    cy.stub(Countries, 'getCountries').resolves(['United States of America (the)', 'Canada'])
    cy.stub(Storage, 'getCurrentUser').returns(user)
    cy.stub(User, 'getMe').resolves(user)
    cy.stub(User, 'getSOsForCurrentUser').resolves(userSigningOfficials)
    cy.stub(Collections, 'getCollectionById').resolves(darCollection)
    cy.stub(DataSet, 'getDatasetsByIds').resolves(datasets)
    cy.stub(NotificationService, 'getBannerObjectById').resolves({})
    cy.stub(DAAUtils, 'isEnabled').returns(true)
    cy.stub(DAR, 'getPartialDarRequest').resolves(darCollection.dars['011467b7-5544-499f-9210-3c2035810639'])
    cy.stub(DAA, 'getDaas').resolves([
      {
        daaId: '100' as unknown as number,
        createUserId: 1,
        createDate: 1,
        dacs: [{ dacId: 1, dacName: 'Test DAC', dacEmail: 'dac@test.com' }],
        file: { fileStorageObjectId: 1, entityId: '1', fileName: 'TestDAA.pdf', category: 'dataAccessAgreement', mediaType: 'application/pdf', createUserId: 1, createDate: 1 },
      },
    ])
    cy.stub(Metrics, 'captureEvent').resolves()
    // Make updateDarDraft hang until we resolve it so we can assert the spinner during save
    let resolveSave: (value?: unknown) => void
    const savePromise = new Promise((resolve) => {
      resolveSave = resolve
    })
    const updateDarStub = cy.stub(DAR, 'updateDarDraft').callsFake(async () => {
      await savePromise
      return { referenceId: 'ref-123' }
    })
    cy.stub(DAR, 'uploadDARDocument').resolves({ data: {} })
    cy.stub(DAR, 'postDarDraft').resolves({ referenceId: 'ref-123' })

    // Mock DAR submission to hang so we can see the spinner
    let resolveSubmit: (value?: unknown) => void
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve
    })
    const postDarStub = cy.stub(DAR, 'postDar').callsFake(async () => {
      await submitPromise
      return {}
    })

    mount(
      <MemoryRouter initialEntries={['/dar_application/011467b7-5544-499f-9210-3c2035810639']}>
        <Routes>
          <Route
            path="/dar_application/:dataRequestId"
            element={(
              <DataAccessRequestApplication
                draftDar={true}
                isProgressReportApplication={false}
                existingDarsReadOnlyMode={false}
              />
            )}
          />
        </Routes>
      </MemoryRouter>,
    )

    // Wait for data to load
    cy.contains('Data Access Request Application').should('be.visible')

    // Fill out required fields
    cy.get('#piCountryOfOperation').type('United{enter}')
    cy.get('#signingOfficial').type('SO 1{enter}')
    cy.get('#itDirector').type('Some IT Director')
    cy.get('#itDirectorEmail').type('it@good.org')
    cy.get('#anvilUse_yes').click()
    cy.get('#projectTitle').clear()
    cy.get('#projectTitle').type('Title')
    cy.get('#rus').type('asdf')
    cy.get('#nonTechRus').type('asdf asdf')

    cy.get('#diseases_no').click()
    cy.get('#hmb_yes').click()

    cy.get('#aiLlmUse_no').click()
    cy.get('#controls_no').click()
    cy.get('#population_no').click()
    cy.get('#oneGender_no').click()
    cy.get('#forProfit_no').click()
    cy.get('#pediatric_no').click()
    cy.get('#vulnerablePopulation_no').click()
    cy.get('#illegalBehavior_no').click()
    cy.get('#sexualDiseases_no').click()
    cy.get('#psychiatricTraits_no').click()
    cy.get('#notHealth_no').click()
    cy.get('#stigmatizedDiseases_no').click()

    // Click "Save" to save the draft and assert spinner shows while saving
    cy.get('#btn_saveDar').click()
    cy.contains('Save changes?').should('be.visible')
    cy.contains('button', 'Yes').click()

    // Spinner should be visible while save is in progress
    cy.get('button[aria-busy="true"]').should('exist')

    // Verify that updateDarDraft was called and then resolve the save
    cy.then(() => {
      assert.isTrue(updateDarStub.called)
      resolveSave()
    })

    // Click "Attest"
    cy.get('#btn_attest').click()

    // Now on Addendum tab, click "Submit"
    cy.get('#btn_openSubmitModal').click()

    // The dialog should be open.
    cy.contains('Submit Data Access Request?').should('be.visible')

    // Click "Yes" in the dialog
    cy.contains('button', 'Yes').click()

    // Now verify the spinner is visible for submit.
    cy.get('button[aria-busy="true"]').should('exist')

    // Verify that postDar was called
    cy.then(() => {
      assert.isTrue(postDarStub.called)
      const submittedDar = postDarStub.getCall(0).args[0]
      expect(submittedDar.daaIds).to.deep.equal([100])
      resolveSubmit()
    })
  })
})
