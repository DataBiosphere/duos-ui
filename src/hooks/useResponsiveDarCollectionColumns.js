import { useState, useEffect } from 'react'
import { getDarCollectionColumns } from '../utils/darCollectionColumns'

/**
 * Custom hook for responsive DAR collection columns
 * Handles window resize events and returns appropriate columns for the console type
 *
 * @param {string} consoleType - The type of console (ADMIN, CHAIR, MEMBER, etc.)
 * @returns {Array} responsiveColumns - Array of column options based on current window width
 */
export function useResponsiveDarCollectionColumns(consoleType) {
  const [responsiveColumns, setResponsiveColumns] = useState(() =>
    getDarCollectionColumns(consoleType, window.innerWidth),
  )

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth
      setResponsiveColumns(getDarCollectionColumns(consoleType, newWidth))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [consoleType])

  return responsiveColumns
}
