import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorReporter } from 'src/libs/ErrorReporter'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Config } from 'src/libs/config'
import { Notifications } from 'src/libs/utils'
import eventList from 'src/libs/events'

vi.mock('src/libs/ajax/Metrics', () => ({
  Metrics: {
    captureEvent: vi.fn(),
  },
}))

vi.mock('src/libs/config', () => ({
  Config: {
    getEnv: vi.fn(),
  },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: {
    showError: vi.fn(),
  },
}))

describe('ErrorReporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getEnv).mockResolvedValue('dev')
  })

  // ── format ───────────────────────────────────────────────────────────────

  describe('format', () => {
    it('prefixes the message with the current environment', async () => {
      const result = await ErrorReporter.format('something broke')
      expect(result).toBe('[dev] something broke ')
    })

    it('uses the environment returned by Config.getEnv', async () => {
      vi.mocked(Config.getEnv).mockResolvedValue('prod')
      const result = await ErrorReporter.format('boom')
      expect(result).toBe('[prod] boom ')
    })
  })

  // ── report ───────────────────────────────────────────────────────────────

  describe('report', () => {
    it('captures the errorReport event with the formatted message', async () => {
      await ErrorReporter.report('roles not found')
      expect(Metrics.captureEvent).toHaveBeenCalledOnce()
      expect(Metrics.captureEvent).toHaveBeenCalledWith(eventList.errorReport, {
        error: '[dev] roles not found ',
      })
    })

    it('does not show a notification when capture succeeds', async () => {
      await ErrorReporter.report('all good')
      expect(Notifications.showError).not.toHaveBeenCalled()
    })

    it('shows an error notification when Metrics.captureEvent throws', async () => {
      vi.mocked(Metrics.captureEvent).mockRejectedValue(new Error('network down'))
      await ErrorReporter.report('boom')
      expect(Notifications.showError).toHaveBeenCalledOnce()
      expect(Notifications.showError).toHaveBeenCalledWith({ text: 'network down' })
    })

    it('shows a fallback message when the thrown error has no message', async () => {
      vi.mocked(Metrics.captureEvent).mockRejectedValue('just a string')
      await ErrorReporter.report('boom')
      expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Unknown error' })
    })

    it('does not throw when capture fails', async () => {
      vi.mocked(Metrics.captureEvent).mockRejectedValue(new Error('network down'))
      await expect(ErrorReporter.report('boom')).resolves.toBeUndefined()
    })
  })
})
