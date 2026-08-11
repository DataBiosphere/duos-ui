/**
 * Full-page navigation seam. The BFF auth flows navigate with real page loads
 * (location.href), not the router — and jsdom can neither stub
 * window.location nor observe assignments to it, so tests mock this module
 * instead of the global.
 */
export const browserNavigation = {
  assign: (url: string): void => {
    globalThis.location.href = url
  },
  currentPathname: (): string => {
    return globalThis.location.pathname
  },
}
