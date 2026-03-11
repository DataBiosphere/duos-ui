import { shouldSkip401Redirect } from 'src/utils/AuthRedirectUtils'

/**
 * Helper to control window.location.pathname without triggering navigation.
 * Uses history.pushState so the native window.location.pathname is updated
 * without reloading the page or triggering router events.
 */
const setPathname = (pathname: string) => {
  globalThis.history.pushState({}, '', pathname)
}

describe('shouldSkip401Redirect', () => {
  afterEach(() => {
    setPathname('/')
  })

  // ─── non-GET methods ────────────────────────────────────────────────────────

  describe('non-GET methods always trigger redirect', () => {
    ['POST', 'PUT', 'PATCH', 'DELETE'].forEach((method) => {
      it(`returns false for ${method}`, () => {
        expect(shouldSkip401Redirect('/api/user/me', method)).to.equal(false)
      })
    })
  })

  // ─── /api/user/me exemption ──────────────────────────────────────────────

  describe('GET /api/user/me is always exempt regardless of route', () => {
    ['/', '/datalibrary', '/profile', '/datalibrary/some-query'].forEach((pathname) => {
      it(`returns true on ${pathname}`, () => {
        setPathname(pathname)
        expect(shouldSkip401Redirect('/api/user/me', 'GET')).to.equal(true)
      })
    })
  })

  // ─── normalizePath behaviour ─────────────────────────────────────────────

  describe('normalizePath — numeric segment replacement', () => {
    beforeEach(() => setPathname('/datalibrary'))

    it('replaces a single numeric segment with :id', () => {
      // /api/dac/123/rules → /api/dac/:id/rules — matched in exempt set
      expect(shouldSkip401Redirect('/api/dac/123/rules', 'GET')).to.equal(true)
    })

    it('does not replace non-numeric segments like version strings (v1, v2)', () => {
      // /api/repository/v1/snapshots — v1 is NOT numeric, must stay as-is to match exempt set
      expect(shouldSkip401Redirect('/api/repository/v1/snapshots', 'GET')).to.equal(true)
    })

    it('does not replace alphanumeric segments like DUOS-123', () => {
      // DUOS-123 contains a hyphen so is not pure digits — should NOT be normalized to :id
      expect(shouldSkip401Redirect('/api/dac/DUOS-123/rules', 'GET')).to.equal(false)
    })

    it('handles a full absolute URL correctly', () => {
      // Path extraction must work even when the full origin is present in the URL
      expect(shouldSkip401Redirect(`${globalThis.location.origin}/api/dac/123/rules`, 'GET')).to.equal(true)
    })

    it('does not skip for DAC toggle endpoint — multiple numeric segments do not produce a false match', () => {
      // /api/dac/123/rules/456/toggle → /api/dac/:id/rules/:id/toggle — not in exempt set
      expect(shouldSkip401Redirect('/api/dac/123/rules/456/toggle', 'GET')).to.equal(false)
    })

    it('strips query string before matching', () => {
      // Long query string on snapshots URL must not prevent matching
      expect(shouldSkip401Redirect(
        '/api/repository/v1/snapshots?limit=1000&duosDatasetIds=DUOS-001&duosDatasetIds=DUOS-002',
        'GET',
      )).to.equal(true)
    })
  })

  // ─── isDataLibraryRoute behaviour ───────────────────────────────────────

  describe('isDataLibraryRoute — route detection', () => {
    it('matches /datalibrary exactly', () => {
      setPathname('/datalibrary')
      expect(shouldSkip401Redirect('/api/repository/v1/snapshots', 'GET')).to.equal(true)
    })

    it('matches /datalibrary/ sub-routes', () => {
      setPathname('/datalibrary/some-query')
      expect(shouldSkip401Redirect('/api/repository/v1/snapshots', 'GET')).to.equal(true)
    })

    it('matches case-insensitively e.g. /DataLibrary', () => {
      setPathname('/DataLibrary')
      expect(shouldSkip401Redirect('/api/repository/v1/snapshots', 'GET')).to.equal(true)
    })

    it('does not match /datalibraryfoo — prevents false positives on similar route names', () => {
      setPathname('/datalibraryfoo')
      expect(shouldSkip401Redirect('/api/repository/v1/snapshots', 'GET')).to.equal(false)
    })

    it('does not match unrelated routes', () => {
      setPathname('/profile')
      expect(shouldSkip401Redirect('/api/repository/v1/snapshots', 'GET')).to.equal(false)
    })
  })

  // ─── non-exempt endpoints on data library ───────────────────────────────

  describe('non-exempt endpoints always trigger redirect even on /datalibrary', () => {
    beforeEach(() => setPathname('/datalibrary'))

    it('does not skip redirect for the dataset search endpoint', () => {
      expect(shouldSkip401Redirect('/api/dataset/search/index/v2', 'GET')).to.equal(false)
    })

    it('does not skip redirect for an unrelated DAC endpoint', () => {
      expect(shouldSkip401Redirect('/api/dac/123/datasets', 'GET')).to.equal(false)
    })

    it('does not skip redirect for the DAC rules toggle endpoint', () => {
      expect(shouldSkip401Redirect('/api/dac/123/rules/456/toggle', 'GET')).to.equal(false)
    })
  })
})
