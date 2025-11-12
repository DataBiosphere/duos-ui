import { useEffect } from 'react'

/**
 * Custom hook to set the document title for a page
 * @param pageTitle - The specific page title (e.g., "Researcher Console", "Admin Manage Users")
 * @param suffix - Optional suffix (defaults to "DUOS")
 */
export const usePageTitle = (pageTitle: string, suffix = 'DUOS') => {
  useEffect(() => {
    const previousTitle = document.title
    document.title = pageTitle ? `${pageTitle} | ${suffix}` : suffix

    // Cleanup: restore previous title when component unmounts
    return () => {
      document.title = previousTitle
    }
  }, [pageTitle, suffix])
}
