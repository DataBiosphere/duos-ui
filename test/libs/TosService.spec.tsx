import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { TosService } from 'src/libs/TosService'
import { ToS } from 'src/libs/ajax/ToS'
import { UserStatusInfo } from 'src/types/model'
import { ToSStatus } from 'src/libs/ajax/ToS'

vi.mock('src/libs/ajax/ToS', () => ({
  ToS: {
    getDUOSText: vi.fn(),
    acceptToS: vi.fn(),
    rejectToS: vi.fn(),
  },
}))

describe('TosService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Style helpers ──────────────────────────────────────────────────────────

  describe('getBackgroundStyle', () => {
    it('returns the expected CSS properties', () => {
      const style = TosService.getBackgroundStyle()
      expect(style.marginTop).toBe('-50px')
      expect(style.paddingTop).toBe('25px')
      expect(style.minHeight).toBe('900px')
      expect(style.backgroundRepeat).toBe('no-repeat')
      expect(style.backgroundSize).toBe('cover')
      expect(style.backgroundImage).toContain('linear-gradient')
    })
  })

  describe('getContainerStyle', () => {
    it('returns the expected CSS properties', () => {
      const style = TosService.getContainerStyle()
      expect(style.margin).toBe('50px')
      expect(style.maxWidth).toBe('800px')
      expect(style.padding).toBe('1.5rem')
      expect(style.height).toBe('100%')
      expect(style.backgroundColor).toBe('white')
      expect(style.borderRadius).toBe('5px')
    })
  })

  describe('getScrollableStyle', () => {
    it('returns the expected CSS properties', () => {
      const style = TosService.getScrollableStyle()
      expect(style.marginLeft).toBe('25px')
      expect(style.marginTop).toBe('2rem')
      expect(style.maxWidth).toBe('800px')
      expect(style.height).toBe('400px')
      expect(style.overflowX).toBe('hidden')
      expect(style.overflowY).toBe('auto')
    })
  })

  // ── getFormattedText ───────────────────────────────────────────────────────

  describe('getFormattedText', () => {
    it('calls ToS.getDUOSText once', async () => {
      vi.mocked(ToS.getDUOSText).mockResolvedValue('Terms of service text.')
      await TosService.getFormattedText()
      expect(ToS.getDUOSText).toHaveBeenCalledOnce()
    })

    it('replaces the Terra deep-link base URL with a relative path', async () => {
      vi.mocked(ToS.getDUOSText).mockResolvedValue(
        'Click [here](https://app.terra.bio/#workspaces) to continue.',
      )
      const element = await TosService.getFormattedText()
      const { container } = render(element)
      const link = container.querySelector('a')
      expect(link).not.toBeNull()
      expect(link?.getAttribute('href')).toBe('/workspaces')
    })

    it('opens markdown links in a new tab', async () => {
      vi.mocked(ToS.getDUOSText).mockResolvedValue('[Link](https://example.com)')
      const element = await TosService.getFormattedText()
      const { container } = render(element)
      const link = container.querySelector('a')
      expect(link?.getAttribute('target')).toBe('_blank')
    })

    it('renders plain text content from the ToS markdown', async () => {
      vi.mocked(ToS.getDUOSText).mockResolvedValue('You must agree to these terms.')
      const element = await TosService.getFormattedText()
      const { container } = render(element)
      expect(container.textContent).toContain('You must agree to these terms.')
    })
  })

  // ── acceptTos ─────────────────────────────────────────────────────────────

  describe('acceptTos', () => {
    it('delegates to ToS.acceptToS and returns the result', async () => {
      const mockResult: UserStatusInfo = {
        enabled: true,
        userEmail: 'user@example.com',
        userSubjectId: 'sub-123',
        tosAccepted: true,
      }
      vi.mocked(ToS.acceptToS).mockResolvedValue(mockResult)
      const result = await TosService.acceptTos()
      expect(ToS.acceptToS).toHaveBeenCalledOnce()
      expect(result).toBe(mockResult)
    })
  })

  // ── rejectTos ─────────────────────────────────────────────────────────────

  describe('rejectTos', () => {
    it('delegates to ToS.rejectToS and returns the result', async () => {
      const mockResult: ToSStatus = {
        acceptedOn: '2026-05-26T00:00:00.000Z',
        isCurrentVersion: false,
        latestAcceptedVersion: '1.0',
        permitsSystemUsage: false,
      }
      vi.mocked(ToS.rejectToS).mockResolvedValue(mockResult)
      const result = await TosService.rejectTos()
      expect(ToS.rejectToS).toHaveBeenCalledOnce()
      expect(result).toBe(mockResult)
    })
  })
})
