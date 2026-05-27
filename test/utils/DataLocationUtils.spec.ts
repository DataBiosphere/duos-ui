import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getDataLocationLink } from 'src/utils/DataLocationUtils'

describe('DataLocationUtils', () => {
  describe('getDataLocationLink', () => {
    it('should render Terra Data Repo link when location is TDR Location', () => {
      const dataLocation = 'TDR Location'
      const dataUrl = 'https://data.terra.bio/dataset/12345'

      const { container } = render(getDataLocationLink(dataLocation, dataUrl))

      const link = container.querySelector('a')
      expect(link).not.toBeNull()
      expect(link?.getAttribute('href')).toBe(dataUrl)
      expect(link?.textContent).toContain('Terra Data Repo')
    })

    it('should render Terra Workspace link when location is Terra Workspace', () => {
      const dataLocation = 'Terra Workspace'
      const dataUrl = 'https://app.terra.bio/workspace/12345'

      const { container } = render(getDataLocationLink(dataLocation, dataUrl))

      const link = container.querySelector('a')
      expect(link).not.toBeNull()
      expect(link?.getAttribute('href')).toBe(dataUrl)
      expect(link?.textContent).toContain('Terra Workspace')
    })

    it('should render AnVIL Workspace link when location is AnVIL Workspace', () => {
      const dataLocation = 'AnVIL Workspace'
      const dataUrl = 'https://anvil.terra.bio/workspaces/test'

      const { container } = render(getDataLocationLink(dataLocation, dataUrl))

      const link = container.querySelector('a')
      expect(link).not.toBeNull()
      expect(link?.getAttribute('href')).toBe(dataUrl)
      expect(link?.textContent).toContain('AnVIL Workspace')
    })

    it('should render text without link when location is Not Determined', () => {
      const dataLocation = 'Not Determined'
      const dataUrl = 'https://example.com/somewhere'

      const { container } = render(getDataLocationLink(dataLocation, dataUrl))

      // Should render text without a link
      expect(container.querySelector('a')).toBeNull()
      expect(container.textContent).toContain('Not Determined')
    })

    it('should render External to DUOS link when location is Other', () => {
      const dataLocation = 'Other'
      const dataUrl = 'https://example.com/other'

      const { container } = render(getDataLocationLink(dataLocation, dataUrl))

      const link = container.querySelector('a')
      expect(link).not.toBeNull()
      expect(link?.getAttribute('href')).toBe(dataUrl)
      expect(link?.textContent).toContain('External to DUOS')
    })

    it('should handle undefined dataUrl', () => {
      const dataLocation = 'Terra Workspace'
      // No dataUrl provided

      const { container } = render(getDataLocationLink(dataLocation))

      // Should render text without a link
      expect(container.querySelector('a')).toBeNull()
      expect(container.textContent).toContain('Terra Workspace')
    })

    it('should render unsafe dataUrl as inert text', () => {
      const dataLocation = 'Terra Workspace'
      const dataUrl = 'javascript:alert(1)'

      const { container } = render(getDataLocationLink(dataLocation, dataUrl))

      // Should render text without a link for unsafe URLs
      expect(container.querySelector('a')).toBeNull()
      expect(container.textContent).toContain('Terra Workspace')
    })
  })
})
