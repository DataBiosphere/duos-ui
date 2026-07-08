import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { handleSignIn } from 'src/libs/signInUtils'

describe('signInUtils', () => {
  describe('handleSignIn', () => {
    beforeEach(() => {
      window.history.replaceState({}, '', '/')
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should set redirectTo parameter in URL', () => {
      const replaceState = vi.spyOn(window.history, 'replaceState')
      handleSignIn('/datalibrary')
      expect(replaceState).toHaveBeenCalled()
      expect(window.location.search).toContain('redirectTo=%2Fdatalibrary')
    })

    it('should find and click the Sign In button if it exists', () => {
      const button = document.createElement('button')
      button.textContent = 'Sign In'
      const clickSpy = vi.fn()
      button.addEventListener('click', clickSpy)
      document.body.appendChild(button)

      handleSignIn('/datalibrary')

      expect(clickSpy).toHaveBeenCalled()
      button.remove()
    })

    it('should scroll to top if Sign In button is not found (fallback)', () => {
      const scrollTo = vi.mocked(window.scrollTo)

      // Ensure no Sign In button exists
      document.querySelectorAll('button').forEach((button) => {
        if (button.textContent?.trim() === 'Sign In') {
          button.textContent = 'Other Button'
        }
      })

      handleSignIn('/dashboard')
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it.each(['/datalibrary', '/dashboard', '/profile', '/datasets'])(
      'should handle redirect path %s',
      (path) => {
        window.history.replaceState({}, '', '/')
        handleSignIn(path)
        expect(window.location.search).toContain(`redirectTo=${encodeURIComponent(path)}`)
      },
    )

    it('should preserve existing query parameters when setting redirectTo', () => {
      window.history.replaceState({}, '', '/?existingParam=value')
      handleSignIn('/datalibrary')
      expect(window.location.search).toContain('existingParam=value')
      expect(window.location.search).toContain('redirectTo=%2Fdatalibrary')
    })

    it('should find Sign In button with extra whitespace', () => {
      const button = document.createElement('button')
      button.textContent = '  Sign In  '
      const clickSpy = vi.fn()
      button.addEventListener('click', clickSpy)
      document.body.appendChild(button)

      handleSignIn('/datalibrary')

      expect(clickSpy).toHaveBeenCalled()
      button.remove()
    })
  })
})
