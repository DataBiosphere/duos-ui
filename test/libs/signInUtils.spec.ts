import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { handleSignIn } from 'src/libs/signInUtils'
import type { NavigateFunction } from 'react-router'

describe('signInUtils', () => {
  describe('handleSignIn', () => {
    const navigate = vi.fn() as unknown as NavigateFunction

    beforeEach(() => {
      globalThis.history.replaceState({}, '', '/')
      vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {})
      vi.mocked(navigate).mockClear()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should replace the current route with the redirectTo parameter', () => {
      handleSignIn('/datalibrary', navigate)
      expect(navigate).toHaveBeenCalledWith('/?redirectTo=%2Fdatalibrary', { replace: true })
    })

    it('should find and click the Sign In button if it exists', () => {
      const button = document.createElement('button')
      button.textContent = 'Sign In'
      const clickSpy = vi.fn()
      button.addEventListener('click', clickSpy)
      document.body.appendChild(button)

      handleSignIn('/datalibrary', navigate)

      expect(clickSpy).toHaveBeenCalled()
      button.remove()
    })

    it('should scroll to top if Sign In button is not found (fallback)', () => {
      const scrollTo = vi.mocked(globalThis.scrollTo)

      // Ensure no Sign In button exists
      document.querySelectorAll('button').forEach((button) => {
        if (button.textContent?.trim() === 'Sign In') {
          button.textContent = 'Other Button'
        }
      })

      handleSignIn('/dashboard', navigate)
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it.each(['/datalibrary', '/dashboard', '/profile', '/datasets'])(
      'should handle redirect path %s',
      (path) => {
        globalThis.history.replaceState({}, '', '/')
        handleSignIn(path, navigate)
        expect(navigate).toHaveBeenCalledWith(
          `/?redirectTo=${encodeURIComponent(path)}`,
          { replace: true },
        )
      },
    )

    it('should preserve existing query parameters when setting redirectTo', () => {
      globalThis.history.replaceState({}, '', '/?existingParam=value')
      handleSignIn('/datalibrary', navigate)
      expect(navigate).toHaveBeenCalledWith(
        '/?existingParam=value&redirectTo=%2Fdatalibrary',
        { replace: true },
      )
    })

    it('should find Sign In button with extra whitespace', () => {
      const button = document.createElement('button')
      button.textContent = '  Sign In  '
      const clickSpy = vi.fn()
      button.addEventListener('click', clickSpy)
      document.body.appendChild(button)

      handleSignIn('/datalibrary', navigate)

      expect(clickSpy).toHaveBeenCalled()
      button.remove()
    })
  })
})
