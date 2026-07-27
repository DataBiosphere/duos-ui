import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { applyForAccess } from 'src/utils/accessUtils'
import { DAR } from 'src/libs/ajax/DAR'
import { Notifications } from 'src/libs/utils'
import { NavigateFunction } from 'react-router'

describe('accessUtils', () => {
  let navigateMock: ReturnType<typeof vi.fn>
  let postDarDraftSpy: ReturnType<typeof vi.spyOn>
  let showErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    navigateMock = vi.fn()
    postDarDraftSpy = vi.spyOn(DAR, 'postDarDraft')
    showErrorSpy = vi.spyOn(Notifications, 'showError').mockReturnValue(undefined as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('applyForAccess', () => {
    it('navigates to DAR application page when draft is created successfully', async () => {
      const referenceId = 'REF-123'
      const selectedDatasets = [123456, 234567]

      postDarDraftSpy.mockResolvedValue({ referenceId })

      await applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)

      expect(postDarDraftSpy).toHaveBeenCalledWith({ datasetId: selectedDatasets })
      expect(navigateMock).toHaveBeenCalledWith(`/dar_application/${referenceId}`)
      expect(showErrorSpy).not.toHaveBeenCalled()
    })

    it('shows generic error when response has no referenceId', async () => {
      const selectedDatasets = [123456]

      postDarDraftSpy.mockResolvedValue({})

      await applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)

      expect(postDarDraftSpy).toHaveBeenCalledWith({ datasetId: selectedDatasets })
      expect(navigateMock).not.toHaveBeenCalled()
      expect(showErrorSpy).toHaveBeenCalledTimes(1)
      expect(showErrorSpy.mock.calls[0][0]).toHaveProperty('text', 'Error: Unable to create a Draft Data Access Request')
    })

    it('shows error notification when postDarDraft throws an error with message', async () => {
      const selectedDatasets = [123456]

      postDarDraftSpy.mockRejectedValue(new Error('Network error occurred'))

      await applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)

      expect(postDarDraftSpy).toHaveBeenCalledWith({ datasetId: selectedDatasets })
      expect(navigateMock).not.toHaveBeenCalled()
      expect(showErrorSpy).toHaveBeenCalledTimes(1)
      expect(showErrorSpy.mock.calls[0][0]).toHaveProperty('timeout', 6000)
      expect(showErrorSpy.mock.calls[0][0]).toHaveProperty('text')
    })

    it('shows generic error when postDarDraft throws an error without extractable message', async () => {
      const selectedDatasets = [123456]

      postDarDraftSpy.mockRejectedValue('Unknown error')

      await applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)

      expect(postDarDraftSpy).toHaveBeenCalledWith({ datasetId: selectedDatasets })
      expect(navigateMock).not.toHaveBeenCalled()
      expect(showErrorSpy).toHaveBeenCalledTimes(1)
      expect(showErrorSpy.mock.calls[0][0]).toHaveProperty('text', 'Error: Unable to create a Draft Data Access Request')
    })

    it('handles multiple dataset IDs correctly', async () => {
      const referenceId = 'REF-456'
      const selectedDatasets = [123456, 234567, 345678]

      postDarDraftSpy.mockResolvedValue({ referenceId })

      await applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)

      expect(postDarDraftSpy).toHaveBeenCalledWith({ datasetId: selectedDatasets })
      expect(navigateMock).toHaveBeenCalledWith(`/dar_application/${referenceId}`)
    })
  })
})
