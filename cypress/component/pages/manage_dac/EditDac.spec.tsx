import React from 'react'
import { DAA } from 'src/libs/ajax/DAA'
import { DAC } from 'src/libs/ajax/DAC'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import EditDac from 'src/pages/manage_dac/EditDac'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import adminJson from '../../DAC/admin.json'
import chairJson from '../../DAC/chair.json'
import dac from '../../DAC/dac.json'
import { Notifications, setUserRoleStatuses } from 'src/libs/utils'
import type { DAAObject, DacObject, DuosUser } from 'src/types/model'

const adminUser = setUserRoleStatuses(adminJson as DuosUser, Storage)
const chairUser = setUserRoleStatuses(chairJson as DuosUser, Storage)
const existingDac = dac as unknown as DacObject

const createMockBroadDaa = (overrides: Partial<DAAObject> = {}): DAAObject => ({
  daaId: 1,
  createUserId: 3479,
  createDate: '2024-08-27T00:00:00Z',
  updateUserId: 3479,
  updateDate: '2024-08-27T00:00:00Z',
  initialDacId: 1,
  file: {
    fileStorageObjectId: 1,
    entityId: '1',
    fileName: 'DUOS_Uniform_Data_Access_Agreement.pdf',
    category: 'dataAccessAgreement' as const,
    mediaType: 'application/octet-stream',
    createUserId: 3479,
    createDate: 1722023675199,
  },
  dacs: [],
  ...overrides,
})

const broadDaaList = [createMockBroadDaa()]

const buildExistingDaas = (): DAAObject[] => {
  return [
    createMockBroadDaa(),
    {
      ...createMockBroadDaa(),
      daaId: 2,
      initialDacId: existingDac.dacId as number,
      file: {
        ...createMockBroadDaa().file,
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

const createUserFromModal = (buttonDataCy: 'btn_create_chair' | 'btn_create_member', name: string, email: string): void => {
  cy.get(`[data-cy="${buttonDataCy}"]`).click()
  cy.contains('Create New User').should('be.visible')
  cy.get('#name').type(name)
  cy.get('#email').type(email)
  cy.get('.ReactModalPortal').contains('button', 'Create').should('not.be.disabled')
  cy.get('.ReactModalPortal').contains('button', 'Create').click()
  cy.contains('Create New User').should('not.exist')
}

const uploadDaaFile = (
  fileName: string,
  fileContent: string = 'mock daa file',
): void => {
  cy.get('[data-cy="daa_upload_button"]').click()

  // Wait for DocumentUpload initialization (selected category) before picking files.
  cy.get('.ReactModalPortal [data-cy="document-upload-fixed-category"]')
    .should('contain', 'Data Access Agreement')

  cy.get('.ReactModalPortal [data-cy="document-upload-dropzone"]').selectFile(
    {
      contents: Cypress.Buffer.from(fileContent),
      fileName,
      mimeType: 'application/pdf',
    },
    {
      action: 'drag-drop',
      force: true,
    },
  )

  cy.get('.ReactModalPortal #btn_save', { timeout: 10000 }).should('not.be.disabled')
  cy.get('.ReactModalPortal #btn_save', { timeout: 10000 }).click()
}

const uploadDaaFiles = (files: Array<{ fileName: string, fileContent?: string }>): void => {
  cy.get('[data-cy="daa_upload_button"]').click()

  cy.get('.ReactModalPortal [data-cy="document-upload-fixed-category"]')
    .should('contain', 'Data Access Agreement')

  cy.get('.ReactModalPortal [data-cy="document-upload-dropzone"]').selectFile(
    files.map(file => ({
      contents: Cypress.Buffer.from(file.fileContent ?? 'mock daa file'),
      fileName: file.fileName,
      mimeType: 'application/pdf',
    })),
    {
      action: 'drag-drop',
      force: true,
    },
  )

  cy.get('.ReactModalPortal #btn_save', { timeout: 10000 }).should('not.be.disabled')
  cy.get('.ReactModalPortal #btn_save', { timeout: 10000 }).click()
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
      cy.get('[data-cy="daa_tabs"]').should('exist')
      cy.get('[data-cy="daa_upload_button"]').should('not.be.disabled')
    })
  })

  it.skip('Admins can create a DAC', () => {
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
    cy.get('[data-cy="daa_option_1"]').check()
    cy.get('[data-cy="btn_save"]').click()
    cy.wrap(dacCreate).should('have.been.called')
    cy.wrap(addDaaToDacStub).should('have.been.called')
  })

  it('Chairs cannot create a DAC', () => {
    setupCreateFlow(chairUser)
    const addDaaToDacStub = cy.stub(DAA, 'addDaaToDac').resolves(200)
    const dacCreate = cy.stub(DAC, 'create').resolves(existingDac)

    fillNewDacForm()
    cy.get('[data-cy="daa_option_1"]').check()
    cy.get('[data-cy="btn_save"]').click()
    cy.wrap(dacCreate).should('not.have.been.called')
    cy.wrap(addDaaToDacStub).should('not.have.been.called')
  })

  it('Does not auto-select a DAA when creating a new DAC', () => {
    setupCreateFlow(adminUser)

    // No DAA should be pre-selected
    cy.get('[data-cy="daa_option_1"]').should('not.be.checked')
  })

  it('Handles onUserCreated for a new chair by selecting the user and adding them during new DAC save', () => {
    const createdChair = {
      userId: 7001,
      displayName: 'New Chair User',
      email: 'new-chair@broadinstitute.org',
    } as DuosUser

    cy.stub(Storage, 'getCurrentUser').returns(adminUser)
    cy.stub(DAA, 'getDaas').resolves(broadDaaList)
    cy.stub(DAC, 'removeDacMember').resolves(200)
    const addDacChairStub = cy.stub(DAC, 'addDacChair').resolves(200)
    cy.stub(DAC, 'removeDacChair').resolves(200)
    const addDacMemberStub = cy.stub(DAC, 'addDacMember').resolves(200)
    const createStub = cy.stub(DAC, 'create').resolves({ ...existingDac, dacId: 99 })
    cy.stub(DAA, 'addDaaToDac').resolves(200)
    const createUserStub = cy.stub(User, 'create').resolves(createdChair)

    cy.mount(<BrowserRouter><EditDac /></BrowserRouter>)

    createUserFromModal('btn_create_chair', createdChair.displayName, createdChair.email)

    cy.wrap(createUserStub).should('have.been.calledWithMatch', {
      displayName: createdChair.displayName,
      email: createdChair.email,
      emailPreference: true,
    })
    cy.contains(`${createdChair.displayName} (${createdChair.email})`).should('be.visible')

    fillNewDacForm()
    cy.get('[data-cy="daa_option_1"]').check()
    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(createStub).should('have.been.calledOnce')
    cy.wrap(addDacChairStub).should('have.been.calledWith', 99, createdChair.userId)
    cy.wrap(addDacMemberStub).should('not.have.been.calledWith', 99, createdChair.userId)
  })

  it('Handles onUserCreated for a new member by selecting the user and adding them during existing DAC save', () => {
    const createdMember = {
      userId: 7002,
      displayName: 'New Member User',
      email: 'new-member@broadinstitute.org',
    } as DuosUser

    cy.stub(Storage, 'getCurrentUser').returns(adminUser)
    cy.stub(DAC, 'get').resolves(existingDac)
    cy.stub(DAA, 'getDaas').resolves(buildExistingDaas())
    cy.stub(DAC, 'removeDacMember').resolves(200)
    cy.stub(DAC, 'addDacChair').resolves(200)
    cy.stub(DAC, 'removeDacChair').resolves(200)
    const addDacMemberStub = cy.stub(DAC, 'addDacMember').resolves(200)
    const updateStub = cy.stub(DAC, 'update').resolves(existingDac)
    const createUserStub = cy.stub(User, 'create').resolves(createdMember)

    mountExistingEditDac(existingDac.dacId as number)

    createUserFromModal('btn_create_member', createdMember.displayName, createdMember.email)

    cy.wrap(createUserStub).should('have.been.calledWithMatch', {
      displayName: createdMember.displayName,
      email: createdMember.email,
      emailPreference: true,
    })
    cy.contains(`${createdMember.displayName} (${createdMember.email})`).should('be.visible')

    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(updateStub).should('have.been.calledOnce')
    cy.wrap(addDacMemberStub).should('have.been.calledWith', existingDac.dacId, createdMember.userId)
  })

  it('Shows error when saving a new DAC without selecting a data access agreement', () => {
    setupCreateFlow(adminUser)
    const errorStub = cy.stub(Notifications, 'showError')
    const createStub = cy.stub(DAC, 'create').resolves(existingDac)

    fillNewDacForm()
    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(errorStub).should('have.been.calledWithMatch', {
      text: 'Please select a data access agreement or upload your own data access agreement before saving.',
    })
    cy.wrap(createStub).should('not.have.been.called')
  })

  it('Allows uploading a custom DAA for new DAC and creates it on save', () => {
    const customFileName = 'new-custom-daa.pdf'

    setupCreateFlow(adminUser)
    cy.stub(DAA, 'addDaaToDac').resolves(200)
    const createStub = cy.stub(DAC, 'create').resolves({ ...existingDac, dacId: 99 })
    const createDaaStub = cy.stub(DAA, 'createDaa').resolves({
      data: { ...broadDaaList[0], daaId: 55 },
    })

    uploadDaaFile(customFileName)

    cy.get('[data-cy="uploaded_daa_name"]').should('contain', customFileName)
    cy.get('[data-cy="uploaded_daa_radio"]').should('be.checked')

    fillNewDacForm()
    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(createStub).should('have.been.called')
    cy.wrap(createDaaStub).should('have.been.calledWithMatch', Cypress.sinon.match.has('name', customFileName), 99)
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
      data: { ...broadDaaList[0], daaId: 77 },
    })

    uploadDaaFile('existing-custom-daa.pdf', 'existing dac daa')

    cy.get('[data-cy="daa_option_77"]').should('be.checked')
    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(createDaaStub).should('have.been.calledWithMatch', Cypress.sinon.match.has('name', 'existing-custom-daa.pdf'), existingDac.dacId)
    cy.wrap(updateStub).should('have.been.called')
    cy.wrap(addDaaToDacStub).should('not.have.been.calledWith', 77, existingDac.dacId)
  })

  it('Creates one DAA per uploaded file when creating a new DAC with multiple files', () => {
    setupCreateFlow(adminUser)
    cy.stub(DAA, 'addDaaToDac').resolves(200)
    const createStub = cy.stub(DAC, 'create').resolves({ ...existingDac, dacId: 99 })
    const createDaaStub = cy.stub(DAA, 'createDaa')
      .onCall(0).resolves({ data: { ...broadDaaList[0], daaId: 201 } })
      .onCall(1).resolves({ data: { ...broadDaaList[0], daaId: 202 } })
      .onCall(2).resolves({ data: { ...broadDaaList[0], daaId: 203 } })
      .onCall(3).resolves({ data: { ...broadDaaList[0], daaId: 204 } })

    uploadDaaFiles([
      { fileName: 'new-custom-daa-1.pdf', fileContent: 'file 1' },
      { fileName: 'new-custom-daa-2.pdf', fileContent: 'file 2' },
      { fileName: 'new-custom-daa-3.pdf', fileContent: 'file 3' },
      { fileName: 'new-custom-daa-4.pdf', fileContent: 'file 4' },
    ])

    fillNewDacForm()
    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(createStub).should('have.been.calledOnce')
    cy.wrap(createDaaStub).should('have.callCount', 4)
  })

  it('Shows per-file error and continues creating remaining DAAs when one uploaded file fails', () => {
    setupCreateFlow(adminUser)
    cy.stub(DAA, 'addDaaToDac').resolves(200)
    cy.stub(DAC, 'create').resolves({ ...existingDac, dacId: 99 })
    const notificationsStub = cy.stub(Notifications, 'showError')
    const createDaaStub = cy.stub(DAA, 'createDaa')
      .onCall(0).resolves({ data: { ...broadDaaList[0], daaId: 301, broadDaa: false } })
      .onCall(1).rejects(new Error('upload failed'))
      .onCall(2).resolves({ data: { ...broadDaaList[0], daaId: 303, broadDaa: false } })
      .onCall(3).resolves({ data: { ...broadDaaList[0], daaId: 304, broadDaa: false } })

    uploadDaaFiles([
      { fileName: 'f1.pdf', fileContent: 'file 1' },
      { fileName: 'f2.pdf', fileContent: 'file 2' },
      { fileName: 'f3.pdf', fileContent: 'file 3' },
      { fileName: 'f4.pdf', fileContent: 'file 4' },
    ])

    fillNewDacForm()
    cy.get('[data-cy="btn_save"]').click()

    cy.wrap(createDaaStub).should('have.callCount', 4)
    cy.wrap(notificationsStub).should('have.been.calledWithMatch', { text: 'Unable to create DAA for \'f2.pdf\'.' })
  })

  describe('DAA Tab Selection - Multiple Shared DAAs', () => {
    it('displays owned and shared DAA tabs', () => {
      const existingDaas = buildExistingDaas()
      setupExistingEditFlow(existingDaas)

      cy.get('[data-cy="daa_tab_owned"]').should('exist').should('be.visible')
      cy.get('[data-cy="daa_tab_shared"]').should('exist').should('be.visible')
      cy.get('[data-cy="daa_tabs"]').should('exist')
    })

    it('shows owned and shared DAA counts in tab labels', () => {
      const existingDaas = [
        {
          ...broadDaaList[0],
          daaId: 1,
          initialDacId: 99, // Owned by different DAC - this is a shared DAA
          broadDaa: true,
        },
        {
          ...broadDaaList[0],
          daaId: 2,
          broadDaa: false,
          initialDacId: existingDac.dacId as number, // Owned by this DAC
          file: { ...broadDaaList[0].file, fileName: 'custom-daa.pdf' },
        },
        {
          ...broadDaaList[0],
          daaId: 3,
          broadDaa: false,
          initialDacId: 100, // Different DAC - also shared
          file: { ...broadDaaList[0].file, fileName: 'shared-daa-2.pdf' },
        },
      ]
      setupExistingEditFlow(existingDaas)

      cy.get('[data-cy="daa_tab_owned"]').invoke('text').should('include', '(1)') // One custom DAA
      cy.get('[data-cy="daa_tab_shared"]').invoke('text').should('include', '(2)') // Two shared DAAs
    })

    it('defaults to shared tab if no DAA assigned', () => {
      const daasWithoutAssignment = [
        {
          ...broadDaaList[0],
          daaId: 1,
          initialDacId: 99, // Shared from another DAC
          broadDaa: true,
        },
        {
          ...broadDaaList[0],
          daaId: 2,
          broadDaa: false,
          initialDacId: existingDac.dacId as number, // Owned by this DAC
          file: { ...broadDaaList[0].file, fileName: 'custom-daa.pdf' },
        },
      ]
      const dacWithoutAssignment = { ...existingDac, associatedDaa: undefined }
      cy.stub(Storage, 'getCurrentUser').returns(adminUser)
      cy.stub(DAC, 'get').resolves(dacWithoutAssignment)
      cy.stub(DAA, 'getDaas').resolves(daasWithoutAssignment)
      stubCommonDacApis()
      mountExistingEditDac(existingDac.dacId as number)

      cy.get('[data-cy="daa_tab_shared"]').should('have.attr', 'aria-selected', 'true')
      cy.get('[data-cy="daa_tab_owned"]').should('have.attr', 'aria-selected', 'false')
    })

    it('defaults to owned tab if selected DAA is owned by this DAC', () => {
      const ownedDaa = {
        ...broadDaaList[0],
        daaId: 2,
        broadDaa: false,
        initialDacId: existingDac.dacId as number,
        file: { ...broadDaaList[0].file, fileName: 'custom-daa.pdf' },
      }
      const daasWithSelection = [...broadDaaList, ownedDaa]
      const dacWithAssignment = { ...existingDac, associatedDaa: ownedDaa }

      cy.stub(Storage, 'getCurrentUser').returns(adminUser)
      cy.stub(DAC, 'get').resolves(dacWithAssignment)
      cy.stub(DAA, 'getDaas').resolves(daasWithSelection)
      stubCommonDacApis()
      mountExistingEditDac(existingDac.dacId as number)

      cy.get('[data-cy="daa_tab_owned"]').should('have.attr', 'aria-selected', 'true')
      cy.get('[data-cy="daa_tab_shared"]').should('have.attr', 'aria-selected', 'false')
    })

    it('defaults to shared tab if selected DAA is shared from another DAC', () => {
      const sharedDaa = {
        ...broadDaaList[0],
        daaId: 5,
        broadDaa: false,
        initialDacId: 99, // Different DAC
        file: { ...broadDaaList[0].file, fileName: 'shared-daa.pdf' },
      }
      const daasWithSelection = [...buildExistingDaas(), sharedDaa]
      const dacWithAssignment = { ...existingDac, associatedDaa: sharedDaa }

      cy.stub(Storage, 'getCurrentUser').returns(adminUser)
      cy.stub(DAC, 'get').resolves(dacWithAssignment)
      cy.stub(DAA, 'getDaas').resolves(daasWithSelection)
      stubCommonDacApis()
      mountExistingEditDac(existingDac.dacId as number)

      cy.get('[data-cy="daa_tab_shared"]').should('have.attr', 'aria-selected', 'true')
      cy.get('[data-cy="daa_tab_owned"]').should('have.attr', 'aria-selected', 'false')
    })

    it('can select DAA from owned tab', () => {
      const existingDaas = buildExistingDaas()
      setupExistingEditFlow(existingDaas)
      const updateStub = cy.stub(DAC, 'update').resolves(existingDac)
      const addDaaToDacStub = cy.stub(DAA, 'addDaaToDac').resolves(200)

      cy.get('[data-cy="daa_tab_owned"]').click()
      cy.get('[data-cy="daa_option_2"]').should('be.visible')
      cy.get('[data-cy="daa_option_2"]').check()
      cy.get('[data-cy="btn_save"]').click()

      cy.wrap(updateStub).should('have.been.called')
      cy.wrap(addDaaToDacStub).should('have.been.calledWith', 2, existingDac.dacId)
    })

    it('can select DAA from shared tab', () => {
      const sharedDaa = {
        ...broadDaaList[0],
        daaId: 5,
        broadDaa: false,
        initialDacId: 99,
        file: { ...broadDaaList[0].file, fileName: 'shared-daa.pdf' },
      }
      const daasWithSelection = [...buildExistingDaas(), sharedDaa]
      cy.stub(Storage, 'getCurrentUser').returns(adminUser)
      cy.stub(DAC, 'get').resolves(existingDac)
      cy.stub(DAA, 'getDaas').resolves(daasWithSelection)
      stubCommonDacApis()
      mountExistingEditDac(existingDac.dacId as number)
      const updateStub = cy.stub(DAC, 'update').resolves(existingDac)
      const addDaaToDacStub = cy.stub(DAA, 'addDaaToDac').resolves(200)

      cy.get('[data-cy="daa_tab_shared"]').click()
      cy.get('[data-cy="daa_option_5"]').should('be.visible')
      cy.get('[data-cy="daa_option_5"]').check()
      cy.get('[data-cy="btn_save"]').click()

      cy.wrap(updateStub).should('have.been.called')
      cy.wrap(addDaaToDacStub).should('have.been.calledWith', 5, existingDac.dacId)
    })

    it('newly uploaded DAA appears in owned tab and is auto-selected', () => {
      const existingDaas = buildExistingDaas()
      setupExistingEditFlow(existingDaas)
      cy.stub(DAA, 'createDaa').resolves({
        data: { ...broadDaaList[0], daaId: 88, broadDaa: false, initialDacId: existingDac.dacId },
      })

      uploadDaaFile('new-daa.pdf')

      cy.get('[data-cy="daa_tab_owned"]').should('have.attr', 'aria-selected', 'true')
      cy.get('[data-cy="daa_option_88"]').should('be.checked')
    })

    it('shows empty state for owned tab when no custom DAAs exist', () => {
      const daasWithoutOwned = [
        {
          ...broadDaaList[0],
          daaId: 1,
          initialDacId: 99, // Shared from another DAC, not owned by this DAC
          broadDaa: true,
        },
      ]
      cy.stub(Storage, 'getCurrentUser').returns(adminUser)
      cy.stub(DAC, 'get').resolves(existingDac)
      cy.stub(DAA, 'getDaas').resolves(daasWithoutOwned)
      stubCommonDacApis()
      mountExistingEditDac(existingDac.dacId as number)

      cy.get('[data-cy="daa_tab_owned"]').click()
      cy.contains('No DAAs created by this DAC').should('be.visible')
    })

    it('shows empty state for shared tab when no shared DAAs exist', () => {
      const daasAllOwned = [
        {
          ...broadDaaList[0],
          daaId: 1,
          initialDacId: existingDac.dacId,
        },
        {
          ...broadDaaList[0],
          daaId: 2,
          initialDacId: existingDac.dacId,
          file: { ...broadDaaList[0].file, fileName: 'custom.pdf' },
        },
      ]
      cy.stub(Storage, 'getCurrentUser').returns(adminUser)
      cy.stub(DAC, 'get').resolves(existingDac)
      cy.stub(DAA, 'getDaas').resolves(daasAllOwned)
      stubCommonDacApis()
      mountExistingEditDac(existingDac.dacId as number)

      cy.get('[data-cy="daa_tab_shared"]').click()
      cy.contains('No DAAs shared with this DAC').should('be.visible')
    })

    it('download button works for DAA in owned tab', () => {
      const existingDaas = [
        {
          ...broadDaaList[0],
          daaId: 2,
          broadDaa: false,
          initialDacId: existingDac.dacId as number,
          file: { ...broadDaaList[0].file, fileName: 'custom-daa.pdf' },
        },
      ]
      setupExistingEditFlow(existingDaas)
      const downloadStub = cy.stub(DAA, 'getDaaFileById').resolves()

      cy.get('[data-cy="daa_tab_owned"]').click()
      // Find the download link by its kebab-case id
      cy.get('#custom-daa-pdf').click()

      cy.wrap(downloadStub).should('have.been.calledWithMatch', 2, 'custom-daa.pdf')
    })

    it('download button works for DAA in shared tab', () => {
      const sharedDaa = {
        ...broadDaaList[0],
        daaId: 5,
        broadDaa: false,
        initialDacId: 99,
        file: { ...broadDaaList[0].file, fileName: 'shared-daa.pdf' },
      }
      const daasWithSelection = [...buildExistingDaas(), sharedDaa]
      cy.stub(Storage, 'getCurrentUser').returns(adminUser)
      cy.stub(DAC, 'get').resolves(existingDac)
      cy.stub(DAA, 'getDaas').resolves(daasWithSelection)
      stubCommonDacApis()
      mountExistingEditDac(existingDac.dacId as number)
      const downloadStub = cy.stub(DAA, 'getDaaFileById').resolves()

      cy.get('[data-cy="daa_tab_shared"]').click()
      cy.get('[data-cy="daa_option_5"]').parent().parent().find('a').click()

      cy.wrap(downloadStub).should('have.been.calledWithMatch', 5, 'shared-daa.pdf')
    })
  })
})

describe('EditDAC Tests - No DAAs Configured', () => {
  it('should display tabs when no DAAs are configured', () => {
    cy.stub(Storage, 'getCurrentUser').returns(adminUser)
    cy.stub(DAC, 'get').resolves(existingDac)
    cy.stub(DAA, 'getDaas').resolves([]) // No DAAs configured
    stubCommonDacApis()

    mountExistingEditDac(existingDac.dacId as number)

    // Wait for tabs to render and verify they exist
    cy.get('[data-cy="daa_tabs"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-cy="daa_tab_owned"]').should('exist')
    cy.get('[data-cy="daa_tab_shared"]').should('exist')

    // Check that upload button is enabled
    cy.get('[data-cy="daa_upload_button"]').should('be.enabled')
  })
})
