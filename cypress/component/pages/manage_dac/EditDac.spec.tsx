import React from 'react'
import { DAA } from 'src/libs/ajax/DAA'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import EditDac from 'src/pages/manage_dac/EditDac'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import adminJson from '../../DAC/admin.json'
import chairJson from '../../DAC/chair.json'
import daas from '../../DAC/daas.json'
import dac from '../../DAC/dac.json'
import { Notifications, setUserRoleStatuses } from 'src/libs/utils'
import type { DAAObject, DacObject, DuosUser } from 'src/types/model'

const adminUser = setUserRoleStatuses({ ...(adminJson as object) } as DuosUser, Storage)
const chairUser = setUserRoleStatuses({ ...(chairJson as object) } as DuosUser, Storage)
const broadDaaList = daas as unknown as DAAObject[]
const existingDac = dac as unknown as DacObject

const buildExistingDaas = (): DAAObject[] => {
  return [
    ...broadDaaList,
    {
      ...broadDaaList[0],
      daaId: 2,
      broadDaa: false,
      initialDacId: existingDac.dacId as number,
      file: {
        ...broadDaaList[0].file,
        fileStorageObjectId: 2,
        fileName: 'custom-daa.pdf',
      },
    },
  ]
}

const mountExistingEditDac = (dacId: number): void => {
  cy.mount(
    <MemoryRouter initialEntries={[`/manage_edit_dac_daa/${dacId}`]}>
      <Routes>
        <Route path="/manage_edit_dac_daa/:dacId" element={<EditDac />} />
      </Routes>
    </MemoryRouter>,
  )
}

const stubCommonDacApis = (): void => {
  cy.stub(DAC, 'removeDacMember').resolves(200)
  cy.stub(DAC, 'addDacChair').resolves(200)
  cy.stub(DAC, 'removeDacChair').resolves(200)
  cy.stub(DAC, 'addDacMember').resolves(200)
}

const fillNewDacForm = (name: string = 'New DAC Name', description: string = 'New DAC Description', email: string = 'New DAC Email'): void => {
  cy.get('[data-cy="dac_name"]').type(name)
  cy.get('[data-cy="dac_description"]').type(description)
  cy.get('[data-cy="dac_email"]').type(email)
}

const uploadDaaFile = (fileName: string, fileContent: string = 'mock daa file'): void => {
  cy.get('[data-cy="daa_upload_button"]').click()
  cy.get('.ReactModalPortal input[type="file"]').selectFile(
    {
      contents: Cypress.Buffer.from(fileContent),
      fileName,
      mimeType: 'application/pdf',
    },
    { force: true },
  )
  cy.get('.ReactModalPortal #btn_save').click()
}

const setupCreateFlow = (user: DuosUser): void => {
  cy.stub(Storage, 'getCurrentUser').returns(user)
  cy.stub(DAA, 'getDaas').resolves(broadDaaList)
  stubCommonDacApis()
  cy.mount(<BrowserRouter><EditDac /></BrowserRouter>)
}

const setupExistingEditFlow = (daasToReturn: DAAObject[], user: DuosUser = adminUser): void => {
  cy.stub(Storage, 'getCurrentUser').returns(user)
  cy.stub(DAC, 'get').resolves(existingDac)
  cy.stub(DAA, 'getDaas').resolves(daasToReturn)
  stubCommonDacApis()
  mountExistingEditDac(existingDac.dacId as number)
}

describe('EditDAC Tests', () => {
  beforeEach(() => {
    cy.viewport(600, 800)
  })

  Cypress._.each([adminUser, chairUser], (user) => {
    it(`Edit DAC page should load for ${user.displayName}`, () => {
      cy.stub(Storage, 'getCurrentUser').returns(user)
      cy.stub(DAC, 'get').resolves(existingDac)
      cy.stub(DAA, 'getDaas').resolves([])
      mountExistingEditDac(existingDac.dacId as number)

      cy.contains(existingDac.name as string).should('exist')
      cy.get('[data-cy="dac_name"]').should('not.be.disabled')
      cy.get('[data-cy="dac_description"]').should('not.be.disabled')
      cy.get('[data-cy="dac_email"]').should('not.be.disabled')
      cy.get('[data-cy="btn_save"]').should('not.be.disabled')
      cy.get('[data-cy="btn_cancel"]').should('not.be.disabled')
      cy.get('[data-cy="daa_radio"]').should('not.be.disabled')
      cy.get('[data-cy="daa_upload_button"]').should('not.be.disabled')
    })
  })

  it('Admins can create a DAC', () => {
    setupCreateFlow(adminUser)
    const addDaaToDacStub = cy.stub(DAA, 'addDaaToDac').resolves(200)
    const dacCreate = cy.stub(DAC, 'create').resolves(existingDac)

    cy.get('[data-cy="dac_name"]').should('not.be.disabled')
    cy.get('[data-cy="dac_name"]').should('be.empty')
    cy.get('[data-cy="dac_description"]').should('not.be.disabled')
    cy.get('[data-cy="dac_description"]').should('be.empty')
    cy.get('[data-cy="dac_email"]').should('not.be.disabled')
    cy.get('[data-cy="dac_email"]').should('be.empty')
    cy.get('[data-cy="btn_save"]').should('not.be.disabled')
    cy.get('[data-cy="btn_cancel"]').should('not.be.disabled')

    fillNewDacForm()
    cy.get('[data-cy="daa_radio"]').first().check()
    cy.get('[data-cy="btn_save"]').click()
    cy.wrap(dacCreate).should('have.been.called')
    cy.wrap(addDaaToDacStub).should('have.been.called')
  })

  it('Chairs cannot create a DAC', () => {
    setupCreateFlow(chairUser)
    const addDaaToDacStub = cy.stub(DAA, 'addDaaToDac').resolves(200)
    const dacCreate = cy.stub(DAC, 'create').resolves(existingDac)

    fillNewDacForm()
    cy.get('[data-cy="daa_radio"]').first().check()
    cy.get('[data-cy="btn_save"]').click()
    cy.wrap(dacCreate).should('not.have.been.called')
    cy.wrap(addDaaToDacStub).should('not.have.been.called')
  })

  it('Shows an error when admin tries to save new DAC without selecting or uploading DAA', () => {
    setupCreateFlow(adminUser)
    cy.stub(DAA, 'addDaaToDac').resolves(200)
    const notificationsStub = cy.stub(Notifications, 'showError')
    const createStub = cy.stub(DAC, 'create').resolves(existingDac)

    fillNewDacForm()
    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(createStub).should('not.have.been.called')
    cy.wrap(notificationsStub).should('have.been.called')
  })

  it('Allows uploading a custom DAA for new DAC and creates it on save', () => {
    const customFileName = 'new-custom-daa.pdf'

    setupCreateFlow(adminUser)
    cy.stub(DAA, 'addDaaToDac').resolves(200)
    const createStub = cy.stub(DAC, 'create').resolves({ ...existingDac, dacId: 99 })
    const createDaaStub = cy.stub(DAA, 'createDaa').resolves({
      data: { ...broadDaaList[0], daaId: 55, broadDaa: false },
    })

    uploadDaaFile(customFileName)

    cy.get('[data-cy="uploaded_daa_name"]').should('contain', customFileName)
    cy.get('[data-cy="uploaded_daa_radio"]').should('be.checked')

    fillNewDacForm()
    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(createStub).should('have.been.called')
    cy.wrap(createDaaStub).should('have.been.called')
  })

  it('Associates selected non-default DAA when editing an existing DAC', () => {
    const existingDaas = buildExistingDaas()

    setupExistingEditFlow(existingDaas)
    const updateStub = cy.stub(DAC, 'update').resolves(existingDac)
    const addDaaToDacStub = cy.stub(DAA, 'addDaaToDac').resolves(200)

    cy.get('[data-cy="daa_option_2"]').check()
    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(updateStub).should('have.been.called')
    cy.wrap(addDaaToDacStub).should('have.been.calledWith', 2, existingDac.dacId)
  })

  it('Creates and selects uploaded DAA immediately when editing an existing DAC', () => {
    const existingDaas = buildExistingDaas()

    setupExistingEditFlow(existingDaas)
    const updateStub = cy.stub(DAC, 'update').resolves(existingDac)
    const addDaaToDacStub = cy.stub(DAA, 'addDaaToDac').resolves(200)
    const createDaaStub = cy.stub(DAA, 'createDaa').resolves({
      data: { ...broadDaaList[0], daaId: 77, broadDaa: false },
    })

    uploadDaaFile('existing-custom-daa.pdf', 'existing dac daa')

    cy.get('[data-cy="uploaded_daa_radio"]').should('be.checked')
    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(createDaaStub).should('have.been.called')
    cy.wrap(updateStub).should('have.been.called')
    cy.wrap(addDaaToDacStub).should('not.have.been.calledWith', 77, existingDac.dacId)
  })
})
