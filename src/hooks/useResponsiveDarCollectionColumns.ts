import { useEffect, useState } from 'react'
import { getDarCollectionColumns } from 'src/utils/darCollectionColumns'

/**
 * Custom hook for responsive DAR collection columns
 * Handles window resize events and returns appropriate columns for the console type
 *
 * @param consoleType - The type of console (ADMIN, CHAIR, MEMBER, etc.)
 * @returns Array of column options based on current window width
 */
export function useResponsiveDarCollectionColumns(consoleType: string): string[] {
  const [responsiveColumns, setResponsiveColumns] = useState<string[]>(() =>
    getDarCollectionColumns(consoleType, window.innerWidth),
  )

  useEffect(() => {
    const handleResize = (): void => {
      const newWidth = window.innerWidth
      setResponsiveColumns(getDarCollectionColumns(consoleType, newWidth))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [consoleType])

  return responsiveColumns
}
