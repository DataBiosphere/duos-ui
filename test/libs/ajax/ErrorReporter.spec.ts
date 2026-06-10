import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorReporter } from 'src/libs/ErrorReporter'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Config } from 'src/libs/config'
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

    it('swallows errors thrown by Metrics.captureEvent', async () => {
      vi.mocked(Metrics.captureEvent).mockRejectedValue(new Error('network down'))
      await expect(ErrorReporter.report('boom')).resolves.toBeUndefined()
    })
  })
})
