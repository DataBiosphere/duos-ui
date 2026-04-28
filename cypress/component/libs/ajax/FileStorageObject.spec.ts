import { Config } from 'src/libs/config'
import {
  EntityType,
  FileCategory,
  FileStorageObject,
  deleteDocument,
  getDocument,
  getDocumentFile,
  listDocuments,
  updateDocumentCategory,
  uploadDocument,
} from 'src/libs/ajax/FileStorageObject'

const mockFso: FileStorageObject = {
  fileStorageObjectId: 1,
  entityId: '42',
  fileName: 'test.pdf',
  category: FileCategory.IRB_COLLABORATION_LETTER,
  mediaType: 'application/pdf',
  createDate: 1735689600000,
  updateDate: 1735689600000,
  createUserId: 1,
  updateUserId: 1,
  deleted: false,
}

const mockDeletedFso: FileStorageObject = {
  ...mockFso,
  deleted: true,
  deleteUserId: 1,
  deleteDate: 1735689660000,
}

describe('FileStorageObject ajax', () => {
  let fetchStub: ReturnType<typeof cy.stub>

  beforeEach(() => {
    cy.initApplicationConfig()
    cy.stub(Config, 'getApiUrl').resolves('')
    cy.window().then((win) => {
      fetchStub = cy.stub(win, 'fetch')
    })
  })

  afterEach(() => {
    cy.window().then(() => {
      fetchStub.restore()
    })
  })

  describe('uploadDocument', () => {
    it('sends multipart POST and returns the created FSO', () => {
      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response(JSON.stringify(mockFso), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          }),
        )
        const file = new win.File(['data'], 'test.pdf', { type: 'application/pdf' })
        cy.wrap(uploadDocument(EntityType.DATASET, '42', file, FileCategory.IRB_COLLABORATION_LETTER)).then((result) => {
          expect(result).to.deep.equal(mockFso)
          const [url, opts] = fetchStub.firstCall.args
          expect(url).to.equal('/api/document/dataset/42')
          expect(opts.method).to.equal('POST')
          expect(opts.body).to.be.instanceOf(win.FormData)
        })
      })
    })
  })

  describe('updateDocumentCategory', () => {
    it('sends PUT with JSON body and returns the updated FSO', () => {
      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response(JSON.stringify(mockFso), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
        cy.wrap(updateDocumentCategory(EntityType.DATASET, '42', 1, FileCategory.DATA_ACCESS_AGREEMENT)).then((result) => {
          expect(result).to.deep.equal(mockFso)
          const [url, opts] = fetchStub.firstCall.args
          expect(url).to.equal('/api/document/dataset/42/1')
          expect(opts.method).to.equal('PUT')
          expect(JSON.parse(opts.body)).to.deep.equal({ category: 'dataAccessAgreement' })
        })
      })
    })
  })

  describe('getDocument', () => {
    it('sends GET and returns the FSO metadata', () => {
      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response(JSON.stringify(mockFso), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
        cy.wrap(getDocument(EntityType.DAC, '10', 1)).then((result) => {
          expect(result).to.deep.equal(mockFso)
          const [url, opts] = fetchStub.firstCall.args
          expect(url).to.equal('/api/document/dac/10/1')
          expect(opts.method).to.equal('GET')
        })
      })
    })
  })

  describe('getDocumentFile', () => {
    it('sends GET with blob responseType and returns a Blob', () => {
      cy.window().then((win) => {
        const blob = new win.Blob(['file content'], { type: 'application/pdf' })
        fetchStub.resolves(
          new win.Response(blob, {
            status: 200,
            headers: { 'content-type': 'application/pdf' },
          }),
        )
        cy.wrap(getDocumentFile(EntityType.STUDY, '7', 2)).then((result) => {
          expect(result).to.be.instanceOf(win.Blob)
          const [url, opts] = fetchStub.firstCall.args
          expect(url).to.equal('/api/document/study/7/2/file')
          expect(opts.method).to.equal('GET')
          expect(opts.headers['Accept']).to.equal('application/octet-stream')
        })
      })
    })
  })

  describe('listDocuments', () => {
    it('sends GET and returns an array of FSOs', () => {
      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response(JSON.stringify([mockFso]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
        cy.wrap(listDocuments(EntityType.DAR, '99')).then((result) => {
          expect(result).to.deep.equal([mockFso])
          const [url, opts] = fetchStub.firstCall.args
          expect(url).to.equal('/api/document/dar/99')
          expect(opts.method).to.equal('GET')
        })
      })
    })
  })

  describe('deleteDocument', () => {
    it('sends DELETE and returns the soft-deleted FSO', () => {
      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response(JSON.stringify(mockDeletedFso), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
        cy.wrap(deleteDocument(EntityType.DATASET, '42', 1)).then((result) => {
          expect(result).to.deep.equal(mockDeletedFso)
          const [url, opts] = fetchStub.firstCall.args
          expect(url).to.equal('/api/document/dataset/42/1')
          expect(opts.method).to.equal('DELETE')
        })
      })
    })
  })
})
