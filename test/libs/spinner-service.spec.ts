import { beforeEach, describe, expect, it } from 'vitest'
import { SpinnerService, spinnerService } from 'src/libs/spinner-service'

describe('SpinnerService', () => {
  describe('instance', () => {
    it('exports a singleton spinnerService', () => {
      expect(spinnerService).toBeInstanceOf(SpinnerService)
    })
  })

  describe('_register / show', () => {
    let service: SpinnerService

    beforeEach(() => {
      service = new SpinnerService()
    })

    it('shows only the spinner whose name matches', () => {
      const a = { name: 'alpha', show: false }
      const b = { name: 'beta', show: false }
      service._register(a)
      service._register(b)

      service.show('alpha')

      expect(a.show).toBe(true)
      expect(b.show).toBe(false)
    })

    it('does nothing when no spinner with that name is registered', () => {
      const a = { name: 'alpha', show: false }
      service._register(a)

      service.show('nonexistent')

      expect(a.show).toBe(false)
    })
  })

  describe('empty cache', () => {
    it('show does not throw when no spinners are registered', () => {
      const service = new SpinnerService()
      expect(() => service.show('anything')).not.toThrow()
    })
  })
})
