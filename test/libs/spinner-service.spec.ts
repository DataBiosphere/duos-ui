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

  describe('showAll', () => {
    it('sets show to true on every registered spinner', () => {
      const service = new SpinnerService()
      const spinners = [
        { name: 'a', show: false },
        { name: 'b', show: false },
        { name: 'c', show: false },
      ]
      spinners.forEach(s => service._register(s))

      service.showAll()

      spinners.forEach(s => expect(s.show).toBe(true))
    })
  })

  describe('hideAll', () => {
    it('sets show to false on every registered spinner', () => {
      const service = new SpinnerService()
      const spinners = [
        { name: 'a', show: true },
        { name: 'b', show: true },
        { name: 'c', show: true },
      ]
      spinners.forEach(s => service._register(s))

      service.hideAll()

      spinners.forEach(s => expect(s.show).toBe(false))
    })
  })

  describe('showAll then hideAll', () => {
    it('toggles all spinners correctly', () => {
      const service = new SpinnerService()
      const spinner = { name: 'x', show: false }
      service._register(spinner)

      service.showAll()
      expect(spinner.show).toBe(true)

      service.hideAll()
      expect(spinner.show).toBe(false)
    })
  })

  describe('empty cache', () => {
    it('show does not throw when no spinners are registered', () => {
      const service = new SpinnerService()
      expect(() => service.show('anything')).not.toThrow()
    })

    it('showAll does not throw when no spinners are registered', () => {
      const service = new SpinnerService()
      expect(() => service.showAll()).not.toThrow()
    })

    it('hideAll does not throw when no spinners are registered', () => {
      const service = new SpinnerService()
      expect(() => service.hideAll()).not.toThrow()
    })
  })
})
